from collections import Counter
from datetime import UTC, datetime
from sqlite3 import Connection, Row

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import get_connection, get_db, init_schema
from .schemas import (
    CartItemCreate,
    CartItemOut,
    CartItemUpdate,
    CartOut,
    CustomerOut,
    FulfillmentStateUpdate,
    OrderContextIn,
    OrderContextOut,
    OrderReviewOut,
    PreferenceCreate,
    PreferenceOut,
    PreferenceSuggestion,
    ProductOut,
    ShelfLifeCheckRequest,
    ShelfLifeCheckResponse,
    ShopperAlert,
)
from .seed import seed_database
from .shelf_life_engine import evaluate_shelf_life

CATEGORIES = [
    "Dairy",
    "Meat",
    "Vegetables",
    "Leafy Greens",
    "Bakery",
    "Bread/Wheat",
    "Produce/Fruits",
]
SUBSTITUTION_PREFERENCES = [
    "Allow replacement",
    "Ask before replacing",
    "Do not replace",
]
FULFILLMENT_STATES = ["Pending", "Selected", "Substituted", "Unavailable"]
RETAIL_PARTNERS = ["Grocery Preference Layer", "ClubHub", "ValueGrocer", "LocalMarket"]
GROCERY_PROFILES = ["Weekly Groceries", "Meal Prep", "Family Shopping"]
RIPENESS_OPTIONS = {
    "Bananas": ["green", "slightly green", "yellow"],
    "Avocados": ["firm", "medium", "ripe"],
}

app = FastAPI(title="Smart Grocery Preference Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_schema()
    with get_connection() as db:
        seed_database(db)


def row_to_dict(row: Row) -> dict:
    return dict(row)


def get_product_or_404(db: Connection, product_id: int) -> dict:
    product = db.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,),
    ).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return row_to_dict(product)


def status_to_confidence(status: str) -> str:
    return {
        "PASS": "High",
        "WARNING": "Medium",
        "IMPOSSIBLE": "Low",
    }.get(status, "Medium")


def get_best_preference_for_product(
    db: Connection,
    customer_id: int,
    product: dict,
) -> dict | None:
    row = db.execute(
        """
        SELECT * FROM preferences
        WHERE customer_id = ?
          AND (product_id = ? OR (product_id IS NULL AND category = ?))
        ORDER BY
          CASE WHEN product_id = ? THEN 0 ELSE 1 END,
          id DESC
        LIMIT 1
        """,
        (customer_id, product["id"], product["category"], product["id"]),
    ).fetchone()
    return row_to_dict(row) if row else None


def evaluate_product_for_customer(
    db: Connection,
    customer_id: int,
    product: dict,
) -> tuple[str | None, str | None, dict | None]:
    preference = get_best_preference_for_product(db, customer_id, product)
    if not preference or preference["min_shelf_life_days"] is None:
        return None, None, preference

    result = evaluate_shelf_life(
        product["name"],
        preference["min_shelf_life_days"],
        product["typical_shelf_life_days"],
        product["max_realistic_shelf_life_days"],
    )
    return result.status, status_to_confidence(result.status), preference


def row_to_product(row: Row | dict) -> dict:
    return row_to_dict(row) if isinstance(row, Row) else dict(row)


def build_cart_item(db: Connection, cart_row: Row) -> dict:
    item = row_to_dict(cart_row)
    product = get_product_or_404(db, item["product_id"])
    status, confidence, preference = evaluate_product_for_customer(
        db,
        item["customer_id"],
        product,
    )
    item["product"] = product
    item["line_total"] = round(product["sample_price"] * item["quantity"], 2)
    item["shelf_life_status"] = status
    item["freshness_confidence"] = confidence
    item["substitution_preference"] = (
        preference["substitution_preference"] if preference else "Ask before replacing"
    )
    return item


def get_cart_rows(db: Connection, customer_id: int) -> list[Row]:
    return db.execute(
        """
        SELECT * FROM cart_items
        WHERE customer_id = ?
        ORDER BY id
        """,
        (customer_id,),
    ).fetchall()


def build_cart(db: Connection, customer_id: int) -> dict:
    items = [build_cart_item(db, row) for row in get_cart_rows(db, customer_id)]
    return {
        "customer_id": customer_id,
        "items": items,
        "estimated_total": round(sum(item["line_total"] for item in items), 2),
    }


def get_order_context(db: Connection, customer_id: int) -> dict:
    row = db.execute(
        "SELECT * FROM order_contexts WHERE customer_id = ?",
        (customer_id,),
    ).fetchone()
    if row:
        return row_to_dict(row)

    now = datetime.now(UTC).isoformat()
    db.execute(
        """
        INSERT INTO order_contexts (
            customer_id,
            retail_partner,
            grocery_profile,
            updated_at
        )
        VALUES (?, ?, ?, ?)
        """,
        (customer_id, RETAIL_PARTNERS[0], GROCERY_PROFILES[0], now),
    )
    db.commit()
    return {
        "customer_id": customer_id,
        "retail_partner": RETAIL_PARTNERS[0],
        "grocery_profile": GROCERY_PROFILES[0],
        "updated_at": now,
    }


def preference_to_alert(db: Connection, preference: Row) -> ShopperAlert:
    product = (
        db.execute("SELECT * FROM products WHERE id = ?", (preference["product_id"],)).fetchone()
        if preference["product_id"]
        else None
    )
    product_name = product["name"] if product else preference["category"]
    status = "PASS"
    freshness_confidence = "High"
    guidance = product["guidance"] if product else "Use category preference while shopping."

    parts = []
    if preference["min_shelf_life_days"] is not None and product:
        result = evaluate_shelf_life(
            product["name"],
            preference["min_shelf_life_days"],
            product["typical_shelf_life_days"],
            product["max_realistic_shelf_life_days"],
        )
        status = result.status
        freshness_confidence = status_to_confidence(result.status)
        parts.append(
            f"Customer prefers {product['name']} with "
            f"{preference['min_shelf_life_days']}+ days remaining."
        )

    if preference["ripeness"]:
        parts.append(f"Customer prefers {product_name.lower()} {preference['ripeness']}.")

    if preference["notes"]:
        parts.append(preference["notes"])

    return ShopperAlert(
        product_name=product_name,
        category=preference["category"],
        alert=" ".join(parts),
        status=status,
        freshness_confidence=freshness_confidence,
        guidance=guidance,
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/categories")
def get_categories() -> list[str]:
    return CATEGORIES


@app.get("/api/ripeness-options")
def get_ripeness_options() -> dict[str, list[str]]:
    return RIPENESS_OPTIONS


@app.get("/api/substitution-options")
def get_substitution_options() -> list[str]:
    return SUBSTITUTION_PREFERENCES


@app.get("/api/fulfillment-states")
def get_fulfillment_states() -> list[str]:
    return FULFILLMENT_STATES


@app.get("/api/customers", response_model=list[CustomerOut])
def get_customers(db: Connection = Depends(get_db)) -> list[dict]:
    rows = db.execute("SELECT * FROM customers ORDER BY id").fetchall()
    return [row_to_dict(row) for row in rows]


@app.get("/api/products", response_model=list[ProductOut])
def get_products(db: Connection = Depends(get_db)) -> list[dict]:
    rows = db.execute("SELECT * FROM products ORDER BY category, name").fetchall()
    return [row_to_dict(row) for row in rows]


@app.post("/api/engine/check", response_model=ShelfLifeCheckResponse)
def check_shelf_life(
    payload: ShelfLifeCheckRequest,
    db: Connection = Depends(get_db),
) -> ShelfLifeCheckResponse:
    product = get_product_or_404(db, payload.product_id)
    result = evaluate_shelf_life(
        product["name"],
        payload.requested_days,
        product["typical_shelf_life_days"],
        product["max_realistic_shelf_life_days"],
    )
    return ShelfLifeCheckResponse(
        status=result.status,
        message=result.message,
        product_name=product["name"],
        requested_days=payload.requested_days,
        typical_shelf_life_days=product["typical_shelf_life_days"],
        max_realistic_shelf_life_days=product["max_realistic_shelf_life_days"],
    )


@app.get("/api/customers/{customer_id}/preferences", response_model=list[PreferenceOut])
def get_preferences(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> list[dict]:
    rows = db.execute(
        "SELECT * FROM preferences WHERE customer_id = ? ORDER BY id DESC",
        (customer_id,),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


@app.post("/api/preferences", response_model=PreferenceOut)
def create_preference(
    payload: PreferenceCreate,
    db: Connection = Depends(get_db),
) -> dict:
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Unknown category")

    if payload.substitution_preference not in SUBSTITUTION_PREFERENCES:
        raise HTTPException(status_code=400, detail="Invalid substitution preference")

    if payload.product_id:
        product = get_product_or_404(db, payload.product_id)
        if product["category"] != payload.category:
            raise HTTPException(
                status_code=400,
                detail="Product does not belong to selected category",
            )

        valid_ripeness = RIPENESS_OPTIONS.get(product["name"])
        if payload.ripeness and valid_ripeness and payload.ripeness not in valid_ripeness:
            raise HTTPException(status_code=400, detail="Invalid ripeness option")

    created_at = datetime.now(UTC).isoformat()
    cursor = db.execute(
        """
        INSERT INTO preferences (
            customer_id,
            category,
            product_id,
            min_shelf_life_days,
            ripeness,
            substitution_preference,
            notes,
            save_as_default,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.customer_id,
            payload.category,
            payload.product_id,
            payload.min_shelf_life_days,
            payload.ripeness,
            payload.substitution_preference,
            payload.notes,
            1 if payload.save_as_default else 0,
            created_at,
        ),
    )
    db.commit()
    preference = db.execute(
        "SELECT * FROM preferences WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return row_to_dict(preference)


@app.get("/api/customers/{customer_id}/cart", response_model=CartOut)
def get_cart(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> dict:
    return build_cart(db, customer_id)


@app.post("/api/cart/items", response_model=CartItemOut)
def add_cart_item(
    payload: CartItemCreate,
    db: Connection = Depends(get_db),
) -> dict:
    get_product_or_404(db, payload.product_id)
    now = datetime.now(UTC).isoformat()
    db.execute(
        """
        INSERT INTO cart_items (
            customer_id,
            product_id,
            quantity,
            fulfillment_state,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, 'Pending', ?, ?)
        ON CONFLICT(customer_id, product_id) DO UPDATE SET
            quantity = quantity + excluded.quantity,
            updated_at = excluded.updated_at
        """,
        (payload.customer_id, payload.product_id, payload.quantity, now, now),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?",
        (payload.customer_id, payload.product_id),
    ).fetchone()
    return build_cart_item(db, row)


@app.patch("/api/cart/items/{cart_item_id}", response_model=CartItemOut)
def update_cart_item(
    cart_item_id: int,
    payload: CartItemUpdate,
    db: Connection = Depends(get_db),
) -> dict:
    now = datetime.now(UTC).isoformat()
    db.execute(
        """
        UPDATE cart_items
        SET quantity = ?, updated_at = ?
        WHERE id = ?
        """,
        (payload.quantity, now, cart_item_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM cart_items WHERE id = ?", (cart_item_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return build_cart_item(db, row)


@app.patch("/api/cart/items/{cart_item_id}/fulfillment", response_model=CartItemOut)
def update_fulfillment_state(
    cart_item_id: int,
    payload: FulfillmentStateUpdate,
    db: Connection = Depends(get_db),
) -> dict:
    if payload.fulfillment_state not in FULFILLMENT_STATES:
        raise HTTPException(status_code=400, detail="Invalid fulfillment state")

    now = datetime.now(UTC).isoformat()
    db.execute(
        """
        UPDATE cart_items
        SET fulfillment_state = ?, updated_at = ?
        WHERE id = ?
        """,
        (payload.fulfillment_state, now, cart_item_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM cart_items WHERE id = ?", (cart_item_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return build_cart_item(db, row)


@app.delete("/api/cart/items/{cart_item_id}")
def delete_cart_item(
    cart_item_id: int,
    db: Connection = Depends(get_db),
) -> dict[str, str]:
    db.execute("DELETE FROM cart_items WHERE id = ?", (cart_item_id,))
    db.commit()
    return {"status": "deleted"}


@app.get("/api/customers/{customer_id}/order-context", response_model=OrderContextOut)
def read_order_context(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> dict:
    return get_order_context(db, customer_id)


@app.put("/api/customers/{customer_id}/order-context", response_model=OrderContextOut)
def update_order_context(
    customer_id: int,
    payload: OrderContextIn,
    db: Connection = Depends(get_db),
) -> dict:
    if payload.retail_partner not in RETAIL_PARTNERS:
        raise HTTPException(status_code=400, detail="Invalid retail partner")
    if payload.grocery_profile not in GROCERY_PROFILES:
        raise HTTPException(status_code=400, detail="Invalid grocery profile")

    now = datetime.now(UTC).isoformat()
    db.execute(
        """
        INSERT INTO order_contexts (
            customer_id,
            retail_partner,
            grocery_profile,
            updated_at
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(customer_id) DO UPDATE SET
            retail_partner = excluded.retail_partner,
            grocery_profile = excluded.grocery_profile,
            updated_at = excluded.updated_at
        """,
        (customer_id, payload.retail_partner, payload.grocery_profile, now),
    )
    db.commit()
    return get_order_context(db, customer_id)


@app.get("/api/customers/{customer_id}/order-review", response_model=OrderReviewOut)
def get_order_review(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> dict:
    context = get_order_context(db, customer_id)
    cart = build_cart(db, customer_id)
    preferences = [
        row_to_dict(row)
        for row in db.execute(
            "SELECT * FROM preferences WHERE customer_id = ? ORDER BY id DESC",
            (customer_id,),
        ).fetchall()
    ]
    return {
        "customer_id": customer_id,
        "retail_partner": context["retail_partner"],
        "grocery_profile": context["grocery_profile"],
        "selected_items": cart["items"],
        "preferences": preferences,
        "estimated_total": cart["estimated_total"],
    }


def build_store_picker_alerts(db: Connection, customer_id: int) -> list[ShopperAlert]:
    preferences = db.execute(
        "SELECT * FROM preferences WHERE customer_id = ? ORDER BY id DESC",
        (customer_id,),
    ).fetchall()
    return [preference_to_alert(db, preference) for preference in preferences]


@app.get("/api/store-picker/customers/{customer_id}/alerts", response_model=list[ShopperAlert])
def get_store_picker_alerts(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> list[ShopperAlert]:
    return build_store_picker_alerts(db, customer_id)


@app.get("/api/shopper/customers/{customer_id}/alerts", response_model=list[ShopperAlert])
def get_shopper_alerts(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> list[ShopperAlert]:
    return build_store_picker_alerts(db, customer_id)


@app.get(
    "/api/customers/{customer_id}/suggestions",
    response_model=list[PreferenceSuggestion],
)
def get_suggestions(
    customer_id: int,
    db: Connection = Depends(get_db),
) -> list[PreferenceSuggestion]:
    preferences = db.execute(
        "SELECT * FROM preferences WHERE customer_id = ? ORDER BY id DESC",
        (customer_id,),
    ).fetchall()
    products = {
        row["id"]: row_to_dict(row)
        for row in db.execute("SELECT id, name FROM products").fetchall()
    }
    counts = Counter(
        (
            preference["category"],
            preference["product_id"],
            preference["min_shelf_life_days"],
            preference["ripeness"],
        )
        for preference in preferences
    )

    suggestions: list[PreferenceSuggestion] = []
    for key, count in counts.items():
        if count < 2:
            continue

        category, product_id, min_days, ripeness = key
        product = products.get(product_id) if product_id else None
        if min_days is not None:
            detail = f"{min_days}+ days remaining"
        elif ripeness:
            detail = ripeness
        else:
            detail = "this preference"

        suggestions.append(
            PreferenceSuggestion(
                category=category,
                product_name=product["name"] if product else None,
                min_shelf_life_days=min_days,
                ripeness=ripeness,
                suggestion=(
                    f"You have chosen {product['name'] if product else category} "
                    f"with {detail} {count} times. Save it as a default?"
                ),
            )
        )

    return suggestions
