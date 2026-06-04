import React from "react";
import ReactDOM from "react-dom/client";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  PackageCheck,
  Minus,
  Plus,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const retailPartners = ["Grocery Preference Layer", "ClubHub", "ValueGrocer", "LocalMarket"];
const groceryProfiles = [
  {
    name: "Weekly Groceries",
    description: "Balanced freshness defaults for recurring staples.",
    defaultDays: 7,
  },
  {
    name: "Meal Prep",
    description: "Longer remaining life for planned meals and batch cooking.",
    defaultDays: 10,
  },
  {
    name: "Family Shopping",
    description: "Freshness guardrails for larger baskets and shared staples.",
    defaultDays: 8,
  },
];

const categoryVisuals = {
  Dairy: { accent: "dairy", icon: "Milk", label: "Cold case" },
  Meat: { accent: "meat", icon: "Meat", label: "Fresh cut" },
  "Bread/Wheat": { accent: "bread", icon: "Bread", label: "Bakery aisle" },
  Bakery: { accent: "bakery", icon: "Muffin", label: "Baked goods" },
  Produce: { accent: "produce", icon: "Leaf", label: "Fresh produce" },
};

const productVisuals = {
  Milk: { displayName: "Milk" },
  "Greek Yogurt": { displayName: "Yogurt" },
  Chicken: { displayName: "Chicken" },
  Eggs: { displayName: "Eggs" },
  Bread: { displayName: "Bread" },
  Muffins: { displayName: "Muffins" },
  Bananas: { displayName: "Bananas" },
  Avocados: { displayName: "Avocados" },
};

const statusClass = {
  PASS: "pass",
  WARNING: "warning",
  IMPOSSIBLE: "impossible",
};

function App() {
  const [view, setView] = React.useState("shop");
  const [demoMode, setDemoMode] = React.useState("Customer View");
  const [customers, setCustomers] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [ripenessOptions, setRipenessOptions] = React.useState({});
  const [substitutionOptions, setSubstitutionOptions] = React.useState([]);
  const [fulfillmentStates, setFulfillmentStates] = React.useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(1);
  const [orderContext, setOrderContext] = React.useState({
    retail_partner: retailPartners[0],
    grocery_profile: groceryProfiles[0].name,
  });
  const [cart, setCart] = React.useState({ items: [], estimated_total: 0 });
  const [orderReview, setOrderReview] = React.useState(null);
  const [preferences, setPreferences] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [recommendations, setRecommendations] = React.useState([]);
  const [engineResult, setEngineResult] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    category: "Dairy",
    product_id: "",
    min_shelf_life_days: 7,
    ripeness: "",
    substitution_preference: "Ask before replacing",
    notes: "",
    save_as_default: true,
  });

  React.useEffect(() => {
    Promise.all([
      fetchJson("/api/customers"),
      fetchJson("/api/products"),
      fetchJson("/api/categories"),
      fetchJson("/api/ripeness-options"),
      fetchJson("/api/substitution-options"),
      fetchJson("/api/fulfillment-states"),
    ]).then(
      ([
        customerData,
        productData,
        categoryData,
        ripenessData,
        substitutionData,
        fulfillmentData,
      ]) => {
        setCustomers(customerData);
        setProducts(productData);
        setCategories(categoryData);
        setRipenessOptions(ripenessData);
        setSubstitutionOptions(substitutionData);
        setFulfillmentStates(fulfillmentData);
        const milk = productData.find((product) => product.name === "Milk");
        setForm((current) => ({ ...current, product_id: milk?.id || "" }));
      },
    );
  }, []);

  React.useEffect(() => {
    if (!selectedCustomerId) return;
    refreshCustomerData(selectedCustomerId);
  }, [selectedCustomerId]);

  const productsById = React.useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );
  const activeProfile = groceryProfiles.find(
    (profile) => profile.name === orderContext.grocery_profile,
  );
  const visibleProducts = products.filter((product) => product.category === form.category);
  const selectedProduct = productsById[Number(form.product_id)];
  const selectedRipenessOptions = selectedProduct ? ripenessOptions[selectedProduct.name] || [] : [];
  const productManagerMetrics = React.useMemo(
    () => buildProductManagerMetrics({
      alerts,
      cart,
      categories,
      orderReview,
      preferences,
      products,
    }),
    [alerts, cart, categories, orderReview, preferences, products],
  );

  async function fetchJson(path, options) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }

  async function refreshCustomerData(customerId) {
    const [
      preferenceData,
      alertData,
      recommendationData,
      contextData,
      cartData,
      reviewData,
    ] = await Promise.all([
      fetchJson(`/api/customers/${customerId}/preferences`),
      fetchJson(`/api/store-picker/customers/${customerId}/alerts`),
      fetchJson(`/api/customers/${customerId}/suggestions`),
      fetchJson(`/api/customers/${customerId}/order-context`),
      fetchJson(`/api/customers/${customerId}/cart`),
      fetchJson(`/api/customers/${customerId}/order-review`),
    ]);
    setPreferences(preferenceData);
    setAlerts(alertData);
    setRecommendations(recommendationData);
    setOrderContext(contextData);
    setCart(cartData);
    setOrderReview(reviewData);
  }

  async function updateOrderContext(nextContext) {
    const updated = await fetchJson(`/api/customers/${selectedCustomerId}/order-context`, {
      method: "PUT",
      body: JSON.stringify(nextContext),
    });
    setOrderContext(updated);
    await refreshCustomerData(selectedCustomerId);
  }

  async function addToCart(productId) {
    await fetchJson("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({
        customer_id: Number(selectedCustomerId),
        product_id: productId,
        quantity: 1,
      }),
    });
    await refreshCustomerData(selectedCustomerId);
  }

  async function updateCartQuantity(item, nextQuantity) {
    if (nextQuantity <= 0) {
      await fetchJson(`/api/cart/items/${item.id}`, { method: "DELETE" });
    } else {
      await fetchJson(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: nextQuantity }),
      });
    }
    await refreshCustomerData(selectedCustomerId);
  }

  async function updateFulfillmentState(cartItemId, fulfillmentState) {
    await fetchJson(`/api/cart/items/${cartItemId}/fulfillment`, {
      method: "PATCH",
      body: JSON.stringify({ fulfillment_state: fulfillmentState }),
    });
    await refreshCustomerData(selectedCustomerId);
  }

  function setPreferenceFromProduct(product) {
    setView("preferences");
    setForm((current) => ({
      ...current,
      category: product.category,
      product_id: product.id,
      min_shelf_life_days: product.typical_shelf_life_days,
      ripeness: "",
      substitution_preference: "Ask before replacing",
      notes: `Apply my ${orderContext.grocery_profile} freshness preference at ${orderContext.retail_partner}.`,
    }));
  }

  function updateCategory(category) {
    const firstProduct = products.find((product) => product.category === category);
    setForm((current) => ({
      ...current,
      category,
      product_id: firstProduct?.id || "",
      ripeness: "",
    }));
  }

  function applyProfile(profile) {
    updateOrderContext({
      retail_partner: orderContext.retail_partner,
      grocery_profile: profile.name,
    });
    setForm((current) => ({
      ...current,
      min_shelf_life_days: profile.defaultDays,
      notes: `${profile.name} default for my grocery subscription.`,
    }));
  }

  function selectDemoMode(nextMode) {
    setDemoMode(nextMode);
    if (nextMode === "Customer View") {
      setView("shop");
    }
    if (nextMode === "Store Picker View") {
      setView("store-picker");
    }
    if (nextMode === "Product Manager View") {
      setView("product-manager");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setEngineResult(null);

    const payload = {
      customer_id: Number(selectedCustomerId),
      category: form.category,
      product_id: form.product_id ? Number(form.product_id) : null,
      min_shelf_life_days:
        form.min_shelf_life_days === "" ? null : Number(form.min_shelf_life_days),
      ripeness: form.ripeness || null,
      substitution_preference: form.substitution_preference,
      notes: form.notes,
      save_as_default: form.save_as_default,
    };

    try {
      if (payload.product_id && payload.min_shelf_life_days !== null) {
        const result = await fetchJson("/api/engine/check", {
          method: "POST",
          body: JSON.stringify({
            product_id: payload.product_id,
            requested_days: payload.min_shelf_life_days,
          }),
        });
        setEngineResult(result);
      }

      await fetchJson("/api/preferences", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await refreshCustomerData(selectedCustomerId);
      setForm((current) => ({ ...current, notes: "" }));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main>
      <header className="retail-hero">
        <nav className="topbar" aria-label="Retail prototype controls">
          <div className="brand-lockup">
            <Store />
            <div>
              <strong>Grocery Preference Layer</strong>
              <span>Demo Mode</span>
            </div>
          </div>
          <div className="topbar-controls">
            <label>
              Retail Partner
              <select
                value={orderContext.retail_partner}
                onChange={(event) =>
                  updateOrderContext({
                    retail_partner: event.target.value,
                    grocery_profile: orderContext.grocery_profile,
                  })
                }
              >
                {retailPartners.map((partner) => (
                  <option key={partner} value={partner}>
                    {partner}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Customer
              <select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(Number(event.target.value))}>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </nav>

        <div className="hero-content">
          <div>
            <p className="eyebrow">Grocery fulfillment preferences</p>
            <h1>Show how grocery preference data improves fulfillment outcomes.</h1>
            <p className="subtitle">
              A practical way to capture customer preferences, guide store picking, and review fulfillment insights.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setView("shop")}>
                Browse groceries
              </button>
              <button className="secondary-button" onClick={() => selectDemoMode("Product Manager View")}>
                View insights
              </button>
            </div>
          </div>
          <CartSummary
            count={cart.items.reduce((sum, item) => sum + item.quantity, 0)}
            total={cart.estimated_total}
          />
        </div>
      </header>

      <section className="profile-strip" aria-label="Grocery profiles">
        {groceryProfiles.map((profile) => (
          <button
            className={orderContext.grocery_profile === profile.name ? "profile-card active" : "profile-card"}
            key={profile.name}
            onClick={() => applyProfile(profile)}
          >
            <UserRound />
            <span>{profile.name}</span>
            <small>{profile.description}</small>
          </button>
        ))}
      </section>

      <section className="demo-mode-toggle" aria-label="Demo mode toggle">
        {["Customer View", "Store Picker View", "Product Manager View"].map((mode) => (
          <button
            className={demoMode === mode ? "active" : ""}
            key={mode}
            onClick={() => selectDemoMode(mode)}
          >
            {mode}
          </button>
        ))}
      </section>

      <section className="workspace-tabs" aria-label="Prototype sections">
        <button
          className={view === "shop" ? "active" : ""}
          onClick={() => {
            setDemoMode("Customer View");
            setView("shop");
          }}
        >
          Shopping Home
        </button>
        <button
          className={view === "preferences" ? "active" : ""}
          onClick={() => {
            setDemoMode("Customer View");
            setView("preferences");
          }}
        >
          Preferences
        </button>
        <button
          className={view === "review" ? "active" : ""}
          onClick={() => {
            setDemoMode("Customer View");
            setView("review");
          }}
        >
          Order Review
        </button>
        <button
          className={view === "store-picker" ? "active" : ""}
          onClick={() => {
            setDemoMode("Store Picker View");
            setView("store-picker");
          }}
        >
          Store Picker Dashboard
        </button>
        <button
          className={view === "product-manager" ? "active" : ""}
          onClick={() => {
            setDemoMode("Product Manager View");
            setView("product-manager");
          }}
        >
          Insights Dashboard
        </button>
      </section>

      {view === "shop" && (
        <ShoppingHome
          activeProfile={activeProfile}
          addToCart={addToCart}
          cart={cart}
          products={products}
          productsById={productsById}
          setPreferenceFromProduct={setPreferenceFromProduct}
          retailPartner={orderContext.retail_partner}
          updateCartQuantity={updateCartQuantity}
        />
      )}

      {view === "preferences" && (
        <PreferenceCenter
          categories={categories}
          engineResult={engineResult}
          form={form}
          isSaving={isSaving}
          onCategoryChange={updateCategory}
          onFormChange={setForm}
          onSubmit={handleSubmit}
          preferences={preferences}
          productsById={productsById}
          recommendations={recommendations}
          retailPartner={orderContext.retail_partner}
          selectedRipenessOptions={selectedRipenessOptions}
          substitutionOptions={substitutionOptions}
          visibleProducts={visibleProducts}
        />
      )}

      {view === "review" && (
        <OrderReview orderReview={orderReview} productsById={productsById} />
      )}

      {view === "store-picker" && (
        <StorePickerDashboard
          alerts={alerts}
          cart={cart}
          fulfillmentStates={fulfillmentStates}
          products={products}
          retailPartner={orderContext.retail_partner}
          updateFulfillmentState={updateFulfillmentState}
        />
      )}

      {view === "product-manager" && (
        <ProductManagerDashboard
          metrics={productManagerMetrics}
          retailPartner={orderContext.retail_partner}
        />
      )}
    </main>
  );
}

function ShoppingHome({
  activeProfile,
  addToCart,
  cart,
  products,
  productsById,
  retailPartner,
  setPreferenceFromProduct,
  updateCartQuantity,
}) {
  return (
    <div className="shopping-layout">
      <section className="product-market">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Shopping home</p>
            <h2>{retailPartner} grocery catalog</h2>
          </div>
          <span>{activeProfile?.name} profile active</span>
        </div>
        <CategoryOverview products={products} />
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              addToCart={addToCart}
              key={product.id}
              product={product}
              setPreferenceFromProduct={setPreferenceFromProduct}
            />
          ))}
        </div>
      </section>

      <CartPanel
        cart={cart}
        productsById={productsById}
        retailPartner={retailPartner}
        updateCartQuantity={updateCartQuantity}
      />
    </div>
  );
}

function CategoryOverview({ products }) {
  const categories = Object.keys(categoryVisuals).map((category) => ({
    category,
    count: products.filter((product) => product.category === category).length,
    ...categoryVisuals[category],
  }));

  return (
    <div className="category-overview" aria-label="Grocery categories">
      {categories.map((item) => (
        <article className="category-tile" key={item.category}>
          <div className={`category-icon ${item.accent}`} aria-hidden="true">
            {item.icon}
          </div>
          <div>
            <strong>{item.category}</strong>
            <span>
              {item.count} items - {item.label}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProductCard({ addToCart, product, setPreferenceFromProduct }) {
  const categoryVisual = categoryVisuals[product.category] || {
    accent: "default",
    icon: "Grocery",
    label: "Grocery item",
  };
  const productVisual = productVisuals[product.name] || { displayName: product.name };

  return (
    <article className="product-card">
      <div className={`product-media ${categoryVisual.accent}`}>
        <span className="media-icon">{categoryVisual.icon}</span>
        <small>{productVisual.displayName}</small>
      </div>
      <div className="product-copy">
        <div>
          <span className="category-pill">{product.category}</span>
          <h3>{product.name}</h3>
          <p>{product.package_size}</p>
        </div>
        <strong className="price">${product.sample_price.toFixed(2)}</strong>
      </div>
      <div className="shelf-row">
        <PackageCheck />
        <span>
          Typical {product.typical_shelf_life_days} days - max {product.max_realistic_shelf_life_days} days
        </span>
      </div>
      <div className="card-actions">
        <button className="primary-button" onClick={() => addToCart(product.id)}>
          <Plus size={16} />
          Add to cart
        </button>
        <button className="ghost-button" onClick={() => setPreferenceFromProduct(product)}>
          <SlidersHorizontal size={16} />
          Set preference
        </button>
      </div>
    </article>
  );
}

function CartSummary({ count, total }) {
  return (
    <aside className="hero-cart" aria-label="Cart summary">
      <ShoppingCart />
      <div>
        <span>{count} items</span>
        <strong>${total.toFixed(2)}</strong>
        <small>Cart saved for order review and fulfillment.</small>
      </div>
    </aside>
  );
}

function CartPanel({ cart, productsById, retailPartner, updateCartQuantity }) {
  return (
    <aside className="cart-panel">
      <div className="panel-title">
        <ShoppingCart />
        <h2>Cart</h2>
      </div>
      <p className="cart-context">Prepared for {retailPartner} fulfillment.</p>
      {cart.items.length === 0 ? (
        <p className="empty-state">Add groceries to save them for order review.</p>
      ) : (
        <div className="cart-list">
          {cart.items.map((item) => {
            const product = productsById[item.product_id] || item.product;
            return (
              <article className="cart-item" key={item.id}>
                <div>
                  <strong>{product?.name}</strong>
                  <span>
                    Qty {item.quantity} - ${product?.sample_price.toFixed(2)} {product?.package_size}
                  </span>
                  {item.freshness_confidence && (
                    <small>Freshness confidence: {item.freshness_confidence}</small>
                  )}
                </div>
                <div className="quantity-controls" aria-label={`${product?.name} quantity controls`}>
                  <button
                    aria-label={`Decrease ${product?.name} quantity`}
                    onClick={() => updateCartQuantity(item, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <strong>{item.quantity}</strong>
                  <button
                    aria-label={`Increase ${product?.name} quantity`}
                    onClick={() => updateCartQuantity(item, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="cart-total">
        <span>Estimated total</span>
        <strong>${cart.estimated_total.toFixed(2)}</strong>
      </div>
    </aside>
  );
}

function PreferenceCenter({
  categories,
  engineResult,
  form,
  isSaving,
  onCategoryChange,
  onFormChange,
  onSubmit,
  preferences,
  productsById,
  recommendations,
  retailPartner,
  selectedRipenessOptions,
  substitutionOptions,
  visibleProducts,
}) {
  return (
    <div className="preference-layout">
      <section className="panel">
        <div className="panel-title">
          <ClipboardList />
          <h2>Category Freshness Preferences</h2>
        </div>
        <p className="panel-copy">Set freshness and substitution rules before the order is picked.</p>
        <form className="preference-form" onSubmit={onSubmit}>
          <label>
            Category
            <select value={form.category} onChange={(event) => onCategoryChange(event.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Product scope
            <select
              value={form.product_id}
              onChange={(event) => onFormChange((current) => ({ ...current, product_id: event.target.value, ripeness: "" }))}
            >
              <option value="">All {form.category}</option>
              {visibleProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Minimum days remaining
            <input
              min="0"
              max="60"
              type="number"
              value={form.min_shelf_life_days}
              onChange={(event) => onFormChange((current) => ({ ...current, min_shelf_life_days: event.target.value }))}
            />
          </label>

          {selectedRipenessOptions.length > 0 && (
            <label>
              Produce ripeness
              <select value={form.ripeness} onChange={(event) => onFormChange((current) => ({ ...current, ripeness: event.target.value }))}>
                <option value="">No ripeness preference</option>
                {selectedRipenessOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Substitution preference
            <select
              value={form.substitution_preference}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  substitution_preference: event.target.value,
                }))
              }
            >
              {substitutionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fulfillment note
            <textarea
              value={form.notes}
              onChange={(event) => onFormChange((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Example: choose the furthest-dated carton"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.save_as_default}
              onChange={(event) => onFormChange((current) => ({ ...current, save_as_default: event.target.checked }))}
            />
            Save as default for this grocery profile
          </label>

          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save preference"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <Sparkles />
          <h2>Smart Recommendations</h2>
        </div>
        {recommendations.length === 0 ? (
          <p className="empty-state">Repeated choices will appear here as subscription defaults.</p>
        ) : (
          <div className="stack">
            {recommendations.map((recommendation) => (
              <article
                className="recommendation"
                key={`${recommendation.category}-${recommendation.product_name}-${recommendation.min_shelf_life_days}-${recommendation.ripeness}`}
              >
                <Sparkles size={18} />
                <p>{recommendation.suggestion}</p>
              </article>
            ))}
          </div>
        )}

        {engineResult && (
          <article className={`engine-result ${statusClass[engineResult.status]}`}>
            <StatusIcon status={engineResult.status} />
            <div>
              <strong>{engineResult.status}</strong>
              <p>{engineResult.message}</p>
              <small>Freshness confidence: {confidenceForStatus(engineResult.status)}</small>
            </div>
          </article>
        )}
      </section>

      <section className="panel wide-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">{retailPartner} preference layer</p>
            <h2>Saved Preferences</h2>
          </div>
          <span>{preferences.length} saved</span>
        </div>
        <div className="preference-list">
          {preferences.map((preference) => {
            const product = productsById[preference.product_id];
            return (
              <article className="preference-card" key={preference.id}>
                <span className="category-pill">{preference.category}</span>
                <h3>{product?.name || `All ${preference.category}`}</h3>
                <p>
                  {preference.min_shelf_life_days !== null
                    ? `${preference.min_shelf_life_days}+ days remaining`
                    : "No shelf-life minimum"}
                  {preference.ripeness ? ` - ${preference.ripeness}` : ""}
                </p>
                <small>{preference.substitution_preference}</small>
                {preference.notes && <small>{preference.notes}</small>}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OrderReview({ orderReview }) {
  if (!orderReview) {
    return (
      <section className="panel">
        <p className="empty-state">Loading order review...</p>
      </section>
    );
  }

  return (
    <div className="review-layout">
      <section className="panel wide-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Order review</p>
            <h2>{orderReview.retail_partner}</h2>
          </div>
          <span>{orderReview.grocery_profile}</span>
        </div>
        <div className="review-summary">
          <article>
            <strong>{orderReview.selected_items.length}</strong>
            <span>Selected items</span>
          </article>
          <article>
            <strong>{orderReview.preferences.length}</strong>
            <span>Freshness preferences</span>
          </article>
          <article>
            <strong>${orderReview.estimated_total.toFixed(2)}</strong>
            <span>Estimated total</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <ShoppingCart />
          <h2>Selected Items</h2>
        </div>
        <div className="review-list">
          {orderReview.selected_items.length === 0 ? (
            <p className="empty-state">No items selected yet.</p>
          ) : (
            orderReview.selected_items.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.product.name}</strong>
                  <span>
                    Qty {item.quantity} - ${item.line_total.toFixed(2)}
                  </span>
                </div>
                <small>
                  {item.freshness_confidence || "No confidence score"} - {item.fulfillment_state}
                </small>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <ClipboardCheck />
          <h2>Customer Preferences</h2>
        </div>
        <div className="review-list">
          {orderReview.preferences.map((preference) => (
            <article key={preference.id}>
              <strong>{preference.category}</strong>
              <span>
                {preference.min_shelf_life_days !== null
                  ? `${preference.min_shelf_life_days}+ days`
                  : "No shelf-life minimum"}
                {preference.ripeness ? ` - ${preference.ripeness}` : ""}
              </span>
              <small>{preference.substitution_preference}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StorePickerDashboard({
  alerts,
  cart,
  fulfillmentStates,
  products,
  retailPartner,
  updateFulfillmentState,
}) {
  return (
    <div className="store-picker-layout">
      <section className="panel wide-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Fulfillment Team</p>
            <h2>Store Picker Dashboard</h2>
          </div>
          <span>{retailPartner}</span>
        </div>
        <div className="fulfillment-list">
          {cart.items.length === 0 ? (
            <p className="empty-state">Add cart items to manage picker workflow states.</p>
          ) : (
            cart.items.map((item) => (
              <article className="fulfillment-card" key={item.id}>
                <div>
                  <span className={`confidence-pill ${confidenceClass(item.freshness_confidence)}`}>
                    {item.freshness_confidence || "No score"}
                  </span>
                  <h3>{item.product.name}</h3>
                  <p>
                    Qty {item.quantity} - {item.substitution_preference}
                  </p>
                </div>
                <label>
                  Workflow state
                  <select
                    value={item.fulfillment_state}
                    onChange={(event) => updateFulfillmentState(item.id, event.target.value)}
                  >
                    {fulfillmentStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <BellRing />
          <h2>Picker Alerts</h2>
        </div>
        <div className="alert-list">
          {alerts.map((alert, index) => (
            <article className={`alert-card ${statusClass[alert.status]}`} key={`${alert.product_name}-${index}`}>
              <StatusIcon status={alert.status} />
              <div>
                <div className="alert-header">
                  <h3>{alert.product_name}</h3>
                  <span>{alert.freshness_confidence}</span>
                </div>
                <p>{alert.alert}</p>
                <small>{alert.guidance}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <RefreshCw />
          <h2>Product Reality</h2>
        </div>
        <div className="product-list">
          {products.map((product) => (
            <article key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.category}</span>
              <small>
                ${product.sample_price.toFixed(2)} - {product.package_size}
              </small>
              <small>
                Typical {product.typical_shelf_life_days}d - max {product.max_realistic_shelf_life_days}d
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductManagerDashboard({ metrics, retailPartner }) {
  return (
    <div className="pm-dashboard">
      <section className="panel wide-panel executive-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Product Manager View</p>
            <h2>Insights Dashboard</h2>
          </div>
          <span>{retailPartner}</span>
        </div>
        <div className="metric-grid">
          {metrics.executive.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel insights-panel">
        <div className="panel-title">
          <ClipboardCheck />
          <h2>Retail Insights</h2>
        </div>
        <div className="insight-list">
          {metrics.insights.map((insight) => (
            <article key={insight.label}>
              <strong>{insight.value}</strong>
              <span>{insight.label}</span>
              <small>{insight.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel business-panel">
        <div className="panel-title">
          <Sparkles />
          <h2>Impact Summary</h2>
        </div>
        <div className="impact-grid">
          {metrics.impact.map((impact) => (
            <article key={impact.label}>
              <strong>{impact.value}</strong>
              <span>{impact.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Charts</p>
            <h2>Operational Performance</h2>
          </div>
          <span>Demo data</span>
        </div>
        <div className="chart-grid">
          <BarChart title="Freshness compliance by category" data={metrics.categoryCompliance} />
          <BarChart title="Customer preference adoption" data={metrics.preferenceAdoption} />
          <DonutChart title="Order fulfillment success rate" value={metrics.fulfillmentSuccess} />
        </div>
      </section>
    </div>
  );
}

function BarChart({ title, data }) {
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div className="bar-list">
        {data.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${item.value}%` }} />
            </div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function DonutChart({ title, value }) {
  return (
    <article className="chart-card donut-card">
      <h3>{title}</h3>
      <div className="donut-wrap">
        <div className="donut" style={{ "--value": `${value}%` }}>
          <strong>{value}%</strong>
        </div>
        <p>Selected or successfully substituted items across the active demo cart.</p>
      </div>
    </article>
  );
}

function buildProductManagerMetrics({ alerts, cart, categories, orderReview, preferences, products }) {
  const itemCount = cart.items.length;
  const successfulItems = cart.items.filter((item) =>
    ["Selected", "Substituted"].includes(item.fulfillment_state),
  ).length;
  const fulfillmentSuccess = itemCount
    ? Math.round((successfulItems / itemCount) * 100)
    : 94;
  const preferenceMatchRate = itemCount
    ? Math.round(
        (cart.items.filter((item) => item.freshness_confidence !== "Low").length / itemCount) * 100,
      )
    : 91;
  const freshnessCompliance = alerts.length
    ? Math.round(
        (alerts.filter((alert) => alert.status !== "IMPOSSIBLE").length / alerts.length) * 100,
      )
    : 92;
  const satisfactionScore = Math.min(99, Math.round((freshnessCompliance + preferenceMatchRate) / 2 + 4));
  const preferencesApplied = preferences.length;
  const ordersToday = Math.max(18, itemCount * 6 + preferencesApplied);
  const mostRequested = categories
    .map((category) => ({
      label: category,
      count: preferences.filter((preference) => preference.category === category).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const categoryCompliance = (categories.length ? categories : ["Dairy", "Meat", "Produce"]).map(
    (category, index) => {
      const categoryAlerts = alerts.filter((alert) => alert.category === category);
      const score = categoryAlerts.length
        ? Math.round(
            (categoryAlerts.filter((alert) => alert.status !== "IMPOSSIBLE").length /
              categoryAlerts.length) *
              100,
          )
        : [96, 89, 94, 87, 92][index] || 90;
      return { label: category, value: score };
    },
  );
  const preferenceAdoption = [
    { label: "Saved defaults", value: Math.min(98, 58 + preferencesApplied * 7) },
    { label: "Cart coverage", value: preferenceMatchRate },
    { label: "Substitution rules", value: Math.min(96, 65 + preferencesApplied * 5) },
  ];

  return {
    executive: [
      {
        label: "Customer Satisfaction Score",
        value: `${satisfactionScore}`,
        detail: "Composite score from confidence and preference matching.",
      },
      {
        label: "Freshness Compliance Rate",
        value: `${freshnessCompliance}%`,
        detail: "PASS or WARNING freshness outcomes.",
      },
      {
        label: "Refund Reduction Estimate",
        value: `${Math.max(12, Math.round((100 - freshnessCompliance) * 1.8 + 18))}%`,
        detail: "Modeled from fewer short-date complaints.",
      },
      {
        label: "Preference Match Rate",
        value: `${preferenceMatchRate}%`,
        detail: "Cart lines covered by viable preferences.",
      },
    ],
    insights: [
      {
        label: "Orders fulfilled today",
        value: ordersToday,
        detail: "Demo projection from active fulfillment volume.",
      },
      {
        label: "Preferences applied",
        value: preferencesApplied,
        detail: "Saved freshness and substitution rules.",
      },
      {
        label: "Customer satisfaction trend",
        value: "+8.4%",
        detail: "Modeled lift after preference-aware picking.",
      },
      {
        label: "Most requested freshness categories",
        value: mostRequested.map((item) => item.label).join(", ") || "Dairy, Produce",
        detail: "Ranked from active customer preferences.",
      },
    ],
    impact: [
      { label: "Estimated reduction in complaints", value: "22%" },
      { label: "Estimated reduction in food waste", value: "14%" },
      { label: "Estimated retention improvement", value: "6.8%" },
    ],
    categoryCompliance,
    preferenceAdoption,
    fulfillmentSuccess,
    orderReview,
    products,
  };
}

function confidenceForStatus(status) {
  return { PASS: "High", WARNING: "Medium", IMPOSSIBLE: "Low" }[status] || "Medium";
}

function confidenceClass(confidence) {
  return {
    High: "pass",
    Medium: "warning",
    Low: "impossible",
  }[confidence] || "warning";
}

function StatusIcon({ status }) {
  if (status === "PASS") return <CheckCircle2 className="status-icon pass" />;
  return <AlertTriangle className={`status-icon ${statusClass[status]}`} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
