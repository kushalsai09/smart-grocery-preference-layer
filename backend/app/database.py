import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parents[1] / "smart_grocery.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    return connection


def init_schema() -> None:
    with get_connection() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                category TEXT NOT NULL,
                sample_price REAL NOT NULL DEFAULT 0,
                package_size TEXT NOT NULL DEFAULT 'each',
                image_url TEXT NOT NULL DEFAULT '',
                typical_shelf_life_days INTEGER NOT NULL,
                max_realistic_shelf_life_days INTEGER NOT NULL,
                guidance TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                product_id INTEGER,
                min_shelf_life_days INTEGER,
                ripeness TEXT,
                substitution_preference TEXT NOT NULL DEFAULT 'Ask before replacing',
                notes TEXT NOT NULL DEFAULT '',
                save_as_default INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                fulfillment_state TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(customer_id, product_id)
            );

            CREATE TABLE IF NOT EXISTS order_contexts (
                customer_id INTEGER PRIMARY KEY,
                retail_partner TEXT NOT NULL DEFAULT 'Grocery Preference Layer',
                grocery_profile TEXT NOT NULL DEFAULT 'Weekly Groceries',
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS backup_rules (
                id INTEGER PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                same_item_freshest_available INTEGER NOT NULL DEFAULT 1,
                same_item_different_size INTEGER NOT NULL DEFAULT 1,
                organic_or_premium_allowed INTEGER NOT NULL DEFAULT 0,
                max_price_increase INTEGER NOT NULL DEFAULT 2,
                similar_item_same_category INTEGER NOT NULL DEFAULT 0,
                reduce_quantity_allowed INTEGER NOT NULL DEFAULT 1,
                skip_if_no_approved_option INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL,
                UNIQUE(customer_id, category)
            );

            CREATE TABLE IF NOT EXISTS product_backup_rules (
                id INTEGER PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                same_item_freshest_available INTEGER NOT NULL DEFAULT 1,
                same_item_different_size INTEGER NOT NULL DEFAULT 1,
                organic_or_premium_allowed INTEGER NOT NULL DEFAULT 0,
                max_price_increase INTEGER NOT NULL DEFAULT 2,
                similar_item_same_category INTEGER NOT NULL DEFAULT 0,
                reduce_quantity_allowed INTEGER NOT NULL DEFAULT 1,
                skip_if_no_approved_option INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL,
                UNIQUE(customer_id, product_id)
            );
            """
        )
        ensure_column(db, "products", "sample_price", "REAL NOT NULL DEFAULT 0")
        ensure_column(db, "products", "package_size", "TEXT NOT NULL DEFAULT 'each'")
        ensure_column(db, "products", "image_url", "TEXT NOT NULL DEFAULT ''")
        ensure_column(
            db,
            "preferences",
            "substitution_preference",
            "TEXT NOT NULL DEFAULT 'Ask before replacing'",
        )
        db.execute(
            """
            UPDATE order_contexts
            SET retail_partner = 'Grocery Preference Layer'
            WHERE retail_partner = 'FreshMart+'
            """
        )


def ensure_column(
    db: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    columns = [row["name"] for row in db.execute(f"PRAGMA table_info({table_name})")]
    if column_name not in columns:
        db.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}")


def get_db():
    db = get_connection()
    try:
        yield db
    finally:
        db.close()
