from pydantic import BaseModel, Field


class CustomerOut(BaseModel):
    id: int
    name: str


class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    sample_price: float
    package_size: str
    image_url: str
    typical_shelf_life_days: int
    max_realistic_shelf_life_days: int
    guidance: str


class PreferenceCreate(BaseModel):
    customer_id: int = 1
    category: str
    product_id: int | None = None
    min_shelf_life_days: int | None = Field(default=None, ge=0, le=60)
    ripeness: str | None = None
    substitution_preference: str = "Ask before replacing"
    notes: str = ""
    save_as_default: bool = False


class PreferenceOut(PreferenceCreate):
    id: int
    created_at: str


class ShelfLifeCheckRequest(BaseModel):
    product_id: int
    requested_days: int = Field(ge=0, le=60)


class ShelfLifeCheckResponse(BaseModel):
    status: str
    message: str
    product_name: str
    requested_days: int
    typical_shelf_life_days: int
    max_realistic_shelf_life_days: int


class ShopperAlert(BaseModel):
    product_name: str
    category: str
    alert: str
    status: str
    freshness_confidence: str
    guidance: str


class PreferenceSuggestion(BaseModel):
    category: str
    product_name: str | None = None
    min_shelf_life_days: int | None = None
    ripeness: str | None = None
    suggestion: str


class CartItemCreate(BaseModel):
    customer_id: int = 1
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class FulfillmentStateUpdate(BaseModel):
    fulfillment_state: str


class CartItemOut(BaseModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    fulfillment_state: str
    created_at: str
    updated_at: str
    product: ProductOut
    line_total: float
    shelf_life_status: str | None = None
    freshness_confidence: str | None = None
    substitution_preference: str | None = None


class CartOut(BaseModel):
    customer_id: int
    items: list[CartItemOut]
    estimated_total: float


class OrderContextIn(BaseModel):
    retail_partner: str = "Grocery Preference Layer"
    grocery_profile: str = "Weekly Groceries"


class OrderContextOut(OrderContextIn):
    customer_id: int
    updated_at: str


class OrderReviewOut(BaseModel):
    customer_id: int
    retail_partner: str
    grocery_profile: str
    selected_items: list[CartItemOut]
    preferences: list[PreferenceOut]
    estimated_total: float
