# Grocery Preference Layer: Retail-Agnostic Freshness Intelligence for Grocery Fulfillment

Grocery Preference Layer is a full-stack retail technology project based on a real grocery delivery problem: items can match the order on paper, but still miss the customer's freshness expectations.

The core idea is simple: customers are not always available to message a picker while an order is being fulfilled. This app lets them set freshness, ripeness, shelf-life, and substitution preferences before the store starts picking.

## Why I Built This

I built this project after receiving grocery delivery items that did not match what I expected in terms of freshness or remaining shelf life. The items were not necessarily wrong, but they were not what I would have picked myself.

That made the gap clear: grocery apps often rely on real-time messages between the customer and picker, but customers are not always available at that exact moment. I wanted to explore what it would look like to capture those preferences earlier and turn them into clear picking guidance.

## Product Summary

Customers often care deeply about freshness, but they may not be available when a store picker is actively shopping their order. This prototype lets customers define preferences ahead of time, gives fulfillment teams practical picking guidance, and gives product managers a simple insights view.

## Problem Statement

Grocery subscription customers may be busy, sleeping, working, commuting, or otherwise unable to respond while an order is being picked. As a result, they can receive:

- Short-expiry milk, yogurt, meat, bread, or bakery items
- Bananas or avocados at the wrong ripeness
- Substitutions they would not have approved
- Items that technically fulfill the order but fail customer expectations

These issues can lead to refunds, complaints, food waste, lower satisfaction, and weaker trust in grocery subscription services.

## Solution Overview

The app captures customer expectations before the order reaches fulfillment.

The system allows customers to save:

- Category-level freshness preferences
- Product-specific shelf-life expectations
- Produce ripeness preferences
- Substitution rules
- Grocery profile defaults

Store pickers then receive clear alerts and fulfillment workflow states. Product managers can use the dashboard to understand where freshness preferences are being used and where they may reduce complaints.

## Key Features

- **Customer Freshness Preferences**: Save minimum shelf-life expectations for Dairy, Meat, Vegetables, Leafy Greens, Bakery, Bread/Wheat, and Produce/Fruits.
- **Produce Ripeness Preferences**: Configure ripeness for bananas and avocados.
- **Substitution Preferences**: Choose Allow replacement, Ask before replacing, or Do not replace.
- **Cart**: Cart items are stored in the FastAPI + SQLite backend.
- **Order Review**: Review selected items, preferences, estimated total, retail partner, and grocery profile.
- **Store Picker Dashboard**: Fulfillment team view with customer alerts, freshness confidence, and workflow states.
- **Shelf-Life Engine**: Python rule-based engine returns `PASS`, `WARNING`, or `IMPOSSIBLE`.
- **Product Manager Dashboard**: Demo mode with KPI cards and visual charts.
- **Impact Metrics**: Modeled estimates for complaint reduction, food waste reduction, refund reduction, and retention lift.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: FastAPI
- **Database**: SQLite
- **Decision Logic**: Python rule-based shelf-life engine

## Architecture Overview

```text
smart-grocery-preference-layer/
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
- Product Manager dashboard
- Cart and order review UI
- Charts and dashboard cards

## Real vs Demo Functionality

### Real Functionality

- React frontend
- FastAPI backend
- SQLite persistence
- Product catalog seed data
- Product prices and package sizes stored in backend
- Local non-branded SVG grocery visuals for stable product card demos
- Persisted cart
- Persisted preferences
- Persisted order context
- Store Picker fulfillment states
- Shelf-life engine
- Freshness confidence mapping
- Order review API

### Demo-Only Functionality

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

## Deployment Notes

The production app is designed to run with:

- **Frontend**: Vercel
- **Backend**: Render

Set this environment variable in Vercel:

```text
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

Set these environment variables in Render:

```text
FRONTEND_ORIGINS=https://your-vercel-frontend-url.vercel.app
DATABASE_PATH=/var/data/smart_grocery.db
```

`FRONTEND_ORIGINS` can contain multiple comma-separated origins if you also use Vercel preview URLs or a custom domain.

The demo uses SQLite. For cart and preference data to survive Render restarts or redeploys, configure a Render persistent disk and point `DATABASE_PATH` to a path on that disk.

## Demo Workflow

### 1. Customer View

Use Customer View to:

- Browse grocery products
- Add products to the cart
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
- Review impact estimates
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
- Add CI/CD checks

## What This Project Shows

This project shows how I approach product development from a real customer pain point, not just from a technical feature list. It starts with a familiar grocery delivery frustration and connects the customer workflow to fulfillment operations and product-management metrics.

For recruiters, it demonstrates full-stack execution with React, FastAPI, SQLite, and a rule-based Python engine. For product managers and retail technology teams, it shows how saved grocery preferences could reduce ambiguity during fulfillment and make freshness expectations easier to act on.
