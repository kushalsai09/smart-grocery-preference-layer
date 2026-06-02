## Why I Built This

I started this project after a real grocery delivery experience where I received items that did not match my freshness expectations, such as short-expiry dairy and produce that was too ripe. I realized that customers are not always available to message the picker while the order is being fulfilled, so I wanted to explore how grocery platforms could capture freshness and substitution preferences before fulfillment begins.

# Grocery Preference Layer: Retail-Agnostic Freshness Intelligence for Grocery Fulfillment

Grocery Preference Layer is a full-stack retail technology prototype that helps grocery subscription and delivery platforms capture customer freshness, ripeness, shelf-life, and substitution preferences before fulfillment begins.

The product is designed as a retailer-agnostic preference layer that could support grocery delivery subscriptions, warehouse clubs, marketplace shoppers, or in-house store fulfillment teams.

## Product Summary

Customers often care deeply about freshness, but they may not be available when a store picker is actively shopping their order. This prototype lets customers define preferences ahead of time, gives fulfillment teams actionable picking guidance, and gives product managers a demonstration dashboard for satisfaction and business-impact insights.

## Problem Statement

Grocery subscription customers may be busy, sleeping, working, commuting, or otherwise unable to respond while an order is being picked. As a result, they can receive:

- Short-expiry milk, yogurt, meat, bread, or bakery items
- Bananas or avocados at the wrong ripeness
- Substitutions they would not have approved
- Items that technically fulfill the order but fail customer expectations

These issues can lead to refunds, complaints, food waste, lower satisfaction, and weaker trust in grocery subscription services.

## Solution Overview

Grocery Preference Layer captures customer expectations before the order reaches fulfillment.

The system allows customers to save:

- Category-level freshness preferences
- Product-specific shelf-life expectations
- Produce ripeness preferences
- Substitution rules
- Grocery profile defaults

Store pickers then receive clear alerts and fulfillment workflow states. Product managers can use the Product Manager Dashboard to demonstrate how preference-aware fulfillment could improve customer satisfaction, reduce complaints, and support retention.

## Key Features

- **Customer Freshness Preferences**: Save minimum shelf-life expectations for dairy, meat, bread/wheat, bakery, and produce.
- **Produce Ripeness Preferences**: Configure ripeness for bananas and avocados.
- **Substitution Preferences**: Choose Allow replacement, Ask before replacing, or Do not replace.
- **Persisted Cart**: Cart items are stored in the FastAPI + SQLite backend.
- **Order Review**: Review selected items, preferences, estimated total, retail partner, and grocery profile.
- **Store Picker Dashboard**: Fulfillment team view with customer alerts, freshness confidence, and workflow states.
- **Shelf-Life Engine**: Python rule-based engine returns `PASS`, `WARNING`, or `IMPOSSIBLE`.
- **Product Manager Dashboard**: Executive-style demo mode with KPI cards and visual charts.
- **Business Impact Metrics**: Modeled estimates for complaint reduction, food waste reduction, refund reduction, and retention lift.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: FastAPI
- **Database**: SQLite
- **Decision Logic**: Python rule-based shelf-life engine

## Architecture Overview

```text
smart-grocery-preference-assistant/
  backend/
    app/
      database.py             # SQLite schema and connection setup
      main.py                 # FastAPI routes and workflow logic
      schemas.py              # Pydantic request/response models
      seed.py                 # Sample products, customers, preferences
      shelf_life_engine.py    # PASS / WARNING / IMPOSSIBLE freshness logic
    requirements.txt

  frontend/
    src/
      main.jsx                # React prototype views and workflows
      styles.css              # Responsive retail prototype styling
    index.html
    package.json
```

### Backend Responsibilities

- Seed product and customer data
- Persist cart items
- Persist customer preferences
- Persist grocery profile and retail partner context
- Evaluate shelf-life requests
- Generate Store Picker alerts
- Return order review data

### Frontend Responsibilities

- Customer shopping and preference workflow
- Store Picker fulfillment workflow
- Product Manager demo dashboard
- Cart and order review UI
- Presentation-ready charts and cards

## Real vs Mocked Functionality

### Real Functionality

- React frontend
- FastAPI backend
- SQLite persistence
- Product catalog seed data
- Product prices and package sizes stored in backend
- Persisted cart
- Persisted preferences
- Persisted order context
- Store Picker fulfillment states
- Shelf-life engine
- Freshness confidence mapping
- Order review API

### Mocked / Demo-Mode Functionality

- Retailer integrations
- Real inventory availability
- Payment or checkout
- Historical customer satisfaction data
- Real refund calculations
- Real food waste calculations
- Real retention calculations
- Production analytics pipeline

> Business metrics in the Product Manager Dashboard are demo-mode modeled estimates. They are not based on real retailer data.

## How To Run Locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend app:

```text
http://localhost:5173
```

## Demo Workflow

### 1. Customer View

Use Customer View to:

- Browse grocery products
- Add products to the persisted cart
- Set freshness preferences
- Set ripeness preferences
- Set substitution preferences
- Review the order before fulfillment

### 2. Store Picker View

Use Store Picker View to:

- Review customer freshness alerts
- See freshness confidence scores
- Update item workflow states:
  - Pending
  - Selected
  - Substituted
  - Unavailable
- Reference product shelf-life reality while picking

### 3. Product Manager View

Use Product Manager View to:

- Present executive KPIs
- Review retail insights
- Demonstrate business impact
- Show visual charts for preference adoption, freshness compliance, and fulfillment success

## Shelf-Life Engine

The shelf-life engine compares requested shelf life against realistic product lifespan.

```text
requested_days <= typical_shelf_life_days
=> PASS
```

```text
requested_days <= max_realistic_shelf_life_days
=> WARNING
```

```text
requested_days > max_realistic_shelf_life_days
=> IMPOSSIBLE
```

Freshness confidence maps from the engine result:

```text
PASS       -> High
WARNING    -> Medium
IMPOSSIBLE -> Low
```

## Future Improvements

- Add authentication and role-based access control
- Move from SQLite to PostgreSQL
- Add real order lifecycle states
- Add shopper/customer messaging for substitutions
- Add inventory availability integration
- Add historical order analytics
- Add complaint, refund, and satisfaction tracking
- Add automated backend and frontend tests
- Split frontend into reusable component files
- Add deployment configuration
- Add CI/CD checks

## Portfolio Positioning

This project demonstrates full-stack product thinking across customer experience, fulfillment operations, and product management analytics. It is intended to show how a technical prototype can connect a real customer pain point to operational workflows and measurable business outcomes.
