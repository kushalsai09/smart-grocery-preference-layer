# Smart Grocery Preference Assistant

Retail Prototype V3 is a retailer-agnostic grocery subscription satisfaction system with Product Manager Demonstration Mode. It presents customer shopping, backend-persisted carts, grocery profiles, freshness preferences, order review, Store Picker execution, and executive metrics for product storytelling.

The prototype intentionally avoids retailer-specific branding. The primary demo partner is **Grocery Preference Layer**, with generic language such as Retail Partner, Grocery Subscription, Store Picker, Fulfillment Team, and Product Manager View.

## Stack

- React + Vite frontend
- FastAPI backend
- SQLite database
- Python rule-based shelf-life engine

## Retail Prototype V3 Features

- Demo Mode toggle for Customer View, Store Picker View, and Product Manager View
- Executive Dashboard with Customer Satisfaction Score, Freshness Compliance Rate, Refund Reduction Estimate, and Preference Match Rate
- Retail Insights Panel with fulfilled orders, preferences applied, satisfaction trend, and requested freshness categories
- Business Impact section for complaint reduction, food waste reduction, and retention improvement
- Visual charts for freshness compliance, preference adoption, and fulfillment success
- Modern grocery shopping homepage
- Retail Partner selector with Grocery Preference Layer, ClubHub, ValueGrocer, and LocalMarket
- Backend-persisted cart experience with estimated totals
- Category-level freshness preferences and produce ripeness preferences
- Substitution preferences and Store Picker workflow states
- Freshness confidence score: High, Medium, Low
- Presentation-ready animated cards and responsive layout

## Project Structure

```text
smart-grocery-preference-assistant/
  backend/
    app/
      database.py
      main.py
      schemas.py
      seed.py
      shelf_life_engine.py
    requirements.txt
  frontend/
    src/
      main.jsx
      styles.css
    index.html
    package.json
  README.md
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API:

```text
http://localhost:8000
```

Docs:

```text
http://localhost:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App:

```text
http://localhost:5173
```

## Key API Endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/categories`
- `GET /api/ripeness-options`
- `GET /api/substitution-options`
- `GET /api/fulfillment-states`
- `GET /api/customers`
- `GET /api/customers/{customer_id}/preferences`
- `POST /api/preferences`
- `POST /api/engine/check`
- `GET /api/customers/{customer_id}/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/{cart_item_id}`
- `PATCH /api/cart/items/{cart_item_id}/fulfillment`
- `DELETE /api/cart/items/{cart_item_id}`
- `GET /api/customers/{customer_id}/order-context`
- `PUT /api/customers/{customer_id}/order-context`
- `GET /api/customers/{customer_id}/order-review`
- `GET /api/store-picker/customers/{customer_id}/alerts`
- `GET /api/customers/{customer_id}/suggestions`

## Shelf-Life Engine Rules

The engine compares requested days remaining against typical and maximum realistic shelf life:

- `PASS`: requested days are within typical shelf life
- `WARNING`: requested days are possible but above typical shelf life
- `IMPOSSIBLE`: requested days exceed realistic shelf life

Freshness confidence maps directly from the shelf-life result:

- `PASS` -> High
- `WARNING` -> Medium
- `IMPOSSIBLE` -> Low
