from datetime import UTC, datetime
from sqlite3 import Connection


CUSTOMERS = [
    {"id": 1, "name": "Maya Patel"},
    {"id": 2, "name": "Jordan Lee"},
]

PRODUCTS = [
    {
        "name": "Milk",
        "category": "Dairy",
        "sample_price": 4.39,
        "package_size": "half gallon",
        "typical_shelf_life_days": 7,
        "max_realistic_shelf_life_days": 14,
        "guidance": "Check sell-by date and choose the furthest-dated carton.",
    },
    {
        "name": "Greek Yogurt",
        "category": "Dairy",
        "sample_price": 5.99,
        "package_size": "32 oz tub",
        "typical_shelf_life_days": 10,
        "max_realistic_shelf_life_days": 21,
        "guidance": "Prefer sealed cups or tubs with no lid bulging.",
    },
    {
        "name": "Chicken",
        "category": "Meat",
        "sample_price": 9.49,
        "package_size": "1.5 lb pack",
        "typical_shelf_life_days": 2,
        "max_realistic_shelf_life_days": 5,
        "guidance": "Choose packages with the latest use-by date and no leaking.",
    },
    {
        "name": "Eggs",
        "category": "Dairy",
        "sample_price": 3.89,
        "package_size": "dozen",
        "typical_shelf_life_days": 21,
        "max_realistic_shelf_life_days": 35,
        "guidance": "Open carton and check for cracks before accepting.",
    },
    {
        "name": "Bread",
        "category": "Bread/Wheat",
        "sample_price": 3.29,
        "package_size": "20 oz loaf",
        "typical_shelf_life_days": 5,
        "max_realistic_shelf_life_days": 10,
        "guidance": "Check best-by date and avoid crushed loaves.",
    },
    {
        "name": "Muffins",
        "category": "Bakery",
        "sample_price": 6.49,
        "package_size": "4 count",
        "typical_shelf_life_days": 3,
        "max_realistic_shelf_life_days": 7,
        "guidance": "Prefer same-day bakery packs when available.",
    },
    {
        "name": "Bananas",
        "category": "Produce",
        "sample_price": 0.69,
        "package_size": "per lb",
        "typical_shelf_life_days": 4,
        "max_realistic_shelf_life_days": 8,
        "guidance": "Match ripeness preference: green, slightly green, or yellow.",
    },
    {
        "name": "Avocados",
        "category": "Produce",
        "sample_price": 1.49,
        "package_size": "each",
        "typical_shelf_life_days": 3,
        "max_realistic_shelf_life_days": 7,
        "guidance": "Match firmness preference: firm, medium, or ripe.",
    },
]

PREFERENCES = [
    {
        "customer_id": 1,
        "category": "Dairy",
        "product_name": "Milk",
        "min_shelf_life_days": 10,
        "ripeness": None,
        "substitution_preference": "Ask before replacing",
        "notes": "Use for weekday breakfasts.",
        "save_as_default": 1,
    },
    {
        "customer_id": 1,
        "category": "Produce",
        "product_name": "Bananas",
        "min_shelf_life_days": None,
        "ripeness": "slightly green",
        "substitution_preference": "Do not replace",
        "notes": "Avoid fully yellow bananas unless there is no alternative.",
        "save_as_default": 1,
    },
    {
        "customer_id": 1,
        "category": "Meat",
        "product_name": "Chicken",
        "min_shelf_life_days": 4,
        "ripeness": None,
        "substitution_preference": "Allow replacement",
        "notes": "Freeze-ready family pack is okay.",
        "save_as_default": 0,
    },
    {
        "customer_id": 2,
        "category": "Bakery",
        "product_name": "Muffins",
        "min_shelf_life_days": 5,
        "ripeness": None,
        "substitution_preference": "Ask before replacing",
        "notes": "Prefer bakery date from today.",
        "save_as_default": 0,
    },
    {
        "customer_id": 2,
        "category": "Produce",
        "product_name": "Avocados",
        "min_shelf_life_days": None,
        "ripeness": "firm",
        "substitution_preference": "Do not replace",
        "notes": "For later in the week.",
        "save_as_default": 1,
    },
]


def seed_database(db: Connection) -> None:
    for customer in CUSTOMERS:
        db.execute(
            """
            INSERT INTO customers (id, name)
            VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET name = excluded.name
            """,
            (customer["id"], customer["name"]),
        )

    for product in PRODUCTS:
        db.execute(
            """
            INSERT INTO products (
                name,
                category,
                sample_price,
                package_size,
                typical_shelf_life_days,
                max_realistic_shelf_life_days,
                guidance
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                category = excluded.category,
                sample_price = excluded.sample_price,
                package_size = excluded.package_size,
                typical_shelf_life_days = excluded.typical_shelf_life_days,
                max_realistic_shelf_life_days = excluded.max_realistic_shelf_life_days,
                guidance = excluded.guidance
            """,
            (
                product["name"],
                product["category"],
                product["sample_price"],
                product["package_size"],
                product["typical_shelf_life_days"],
                product["max_realistic_shelf_life_days"],
                product["guidance"],
            ),
        )

    product_lookup = {
        row["name"]: row["id"] for row in db.execute("SELECT id, name FROM products")
    }
    now = datetime.now(UTC).isoformat()

    if db.execute("SELECT id FROM preferences LIMIT 1").fetchone():
        db.commit()
        return

    for preference_seed in PREFERENCES:
        preference = preference_seed.copy()
        product_name = preference.pop("product_name")
        db.execute(
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
                preference["customer_id"],
                preference["category"],
                product_lookup[product_name],
                preference["min_shelf_life_days"],
                preference["ripeness"],
                preference["substitution_preference"],
                preference["notes"],
                preference["save_as_default"],
                now,
            ),
        )

    db.commit()
