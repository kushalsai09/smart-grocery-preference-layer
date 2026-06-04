# Grocery Preference Layer: Retail-Agnostic Freshness Intelligence for Grocery Fulfillment

Grocery Preference Layer is a full-stack retail technology prototype inspired by a real grocery delivery experience: receiving items that technically matched the order, but did not match freshness expectations.

The core idea is simple: customers are not always available to message a picker while an order is being fulfilled, so the product captures freshness, ripeness, shelf-life, and substitution preferences before fulfillment starts. It is designed as a retailer-agnostic preference layer for grocery delivery subscriptions, warehouse clubs, marketplace shoppers, or in-house store fulfillment teams.

## Why I Built This

I built this project after experiencing a common grocery delivery problem firsthand. Some delivered items did not match what I expected in terms of freshness or remaining shelf life, and by the time the order was being picked, there was no reliable way to communicate every preference in real time.

That experience made the product opportunity clear: grocery platforms should not depend on customers being available at the exact moment a picker has a question. A better system would let customers define freshness, ripeness, shelf-life, and substitution preferences ahead of time, then turn those preferences into clear guidance for fulfillment teams.

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

This project is meant to show how I approach product development from a real customer pain point, not just from a technical feature list. It starts with a familiar grocery delivery frustration, translates that experience into a product opportunity, and then connects the customer workflow to fulfillment operations and product-management metrics.

For recruiters, it demonstrates full-stack execution with React, FastAPI, SQLite, and a rule-based Python engine. For product managers and retail technology teams, it demonstrates how a focused preference layer could reduce ambiguity during fulfillment, improve customer trust, and create a clearer story around freshness compliance, substitutions, and satisfaction.
