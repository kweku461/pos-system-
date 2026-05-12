import "../styles/sales.css";
import logo from "../assets/swiftpos-logo.jpeg";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const TAX_RATE = 0.15;

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

const categoryEmojis = {
  Drinks: "🥤", Foodstuffs: "🍞", Biscuits: "🍪",
  Beverages: "🧃", Snacks: "🍟", Bakery: "🍞",
  Dairy: "🥛", Electronics: "💻", Stationery: "📓",
  Home: "☕",
};

function Sales() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [availableProducts, setAvailableProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [applyTax, setApplyTax] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [cashTendered, setCashTendered] = useState("");

  const [splitCash, setSplitCash] = useState("");
  const [splitMomo, setSplitMomo] = useState("");
  const [splitCard, setSplitCard] = useState("");
  const [splitMomoNumber, setSplitMomoNumber] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [voidId, setVoidId] = useState(null);
  const [voidLoading, setVoidLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSales();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setAvailableProducts(res.data);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await API.get("/sales");
      setSales(res.data);
    } catch (err) {
      console.error("Failed to load sales", err);
    } finally {
      setLoadingSales(false);
    }
  };

  // ── Cart ────────────────────────────────────────────────────────────────────
  const filtered = availableProducts.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    const exists = cart.find((c) => c.product_id === product.product_id);
    if (exists) {
      setCart(cart.map((c) =>
        c.product_id === product.product_id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter((c) => c.product_id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(cart.map((c) => c.product_id === id ? { ...c, qty } : c));
  };

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, c) => sum + parseFloat(c.price) * c.qty, 0);

  const discountAmount = (() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === "percent") return Math.min((val / 100) * subtotal, subtotal);
    return Math.min(val, subtotal);
  })();

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = applyTax ? afterDiscount * TAX_RATE : 0;
  const grandTotal = afterDiscount + taxAmount;

  const splitPaid =
    (parseFloat(splitCash) || 0) +
    (parseFloat(splitMomo) || 0) +
    (parseFloat(splitCard) || 0);

  const splitRemaining = Math.max(grandTotal - splitPaid, 0);
  const cashChange = Math.max((parseFloat(cashTendered) || 0) - grandTotal, 0);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validatePayment = () => {
    if (!paymentMethod) {
      setSubmitError("Please select a payment method.");
      return false;
    }
    if (paymentMethod === "cash") {
      if (!cashTendered || parseFloat(cashTendered) < grandTotal) {
        setSubmitError("Cash tendered must be at least the total amount.");
        return false;
      }
    }
    if (paymentMethod === "momo" && !momoNumber) {
      setSubmitError("Please enter MoMo number.");
      return false;
    }
    if (paymentMethod === "split") {
      if (splitPaid < grandTotal) {
        setSubmitError(`Split total (₵${splitPaid.toFixed(2)}) is less than grand total (₵${grandTotal.toFixed(2)}).`);
        return false;
      }
      if (parseFloat(splitMomo) > 0 && !splitMomoNumber) {
        setSubmitError("Please enter a MoMo number for the mobile money portion.");
        return false;
      }
    }
    return true;
  };

  const paymentLabel = () => {
    if (paymentMethod === "cash") return "Cash";
    if (paymentMethod === "momo") return "Mobile Money";
    if (paymentMethod === "card") return "Card";
    if (paymentMethod === "split") return "Split";
    return "";
  };

  const buildReceipt = useCallback((saleId) => ({
    id: saleId,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    items: cart.map((c) => ({
      name: c.product_name,
      emoji: categoryEmojis[c.category] || "🛒",
      qty: c.qty,
      price: parseFloat(c.price),
    })),
    subtotal, discountType,
    discountValue: parseFloat(discountValue) || 0,
    discountAmount, taxRate: TAX_RATE, taxAmount, grandTotal,
    payment: paymentLabel(),
    cashTendered: paymentMethod === "cash" ? parseFloat(cashTendered) : null,
    cashChange: paymentMethod === "cash" ? cashChange : null,
    splitCash: paymentMethod === "split" ? parseFloat(splitCash) || 0 : null,
    splitMomo: paymentMethod === "split" ? parseFloat(splitMomo) || 0 : null,
    splitCard: paymentMethod === "split" ? parseFloat(splitCard) || 0 : null,
  }), [cart, subtotal, discountType, discountValue, discountAmount, taxAmount,
      grandTotal, paymentMethod, cashTendered, cashChange, splitCash, splitMomo, splitCard]);

  const resetSaleState = () => {
    setCart([]);
    setDiscountValue("");
    setApplyTax(true);
    setPaymentMethod("");
    setMomoNumber("");
    setCashTendered("");
    setSplitCash(""); setSplitMomo(""); setSplitCard(""); setSplitMomoNumber("");
    setSelectedCustomerId("");
    setShowCheckout(false);
    setShowSaleModal(false);
    setSubmitError("");
    setSearch("");
  };

  // ── Complete sale — called after all payment steps succeed ──────────────────
  const completeSale = async (saleId, paymentsPayload) => {
    await API.post("/payments", {
      sale_id: saleId,
      payments: paymentsPayload,
      grand_total: grandTotal,
    });
    setLastSaleReceipt(buildReceipt(saleId));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    await fetchSales();
    resetSaleState();
  };

  // ── Open Paystack popup using window.PaystackPop (from index.html script tag) ──
  // ✅ Uses global window.PaystackPop — no CSP issues
  const openPaystackPopup = ({ saleId, amountCedis, email, channel }) => {
    return new Promise((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error("Paystack is not loaded. Please refresh the page."));
        return;
      }

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email || "customer@swiftpos.com",
        amount: Math.round(amountCedis * 100), // cedis → pesewas
        currency: "GHS",
        ref: `swiftpos_${saleId}_${Date.now()}`,
        channels: channel === "momo" ? ["mobile_money"] : ["card"],
        metadata: { sale_id: saleId },

        callback: async (response) => {
          try {
            const verifyRes = await API.post("/payments/verify-paystack", {
              reference: response.reference,
              sale_id: saleId,
            });
            resolve(verifyRes.data.reference);
          } catch (err) {
            reject(new Error(err.response?.data?.message || "Payment verification failed"));
          }
        },

        onClose: () => {
          reject(new Error("Payment was cancelled."));
        },
      });

      handler.openIframe();
    });
  };

  // ── Main payment handler ────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!validatePayment()) return;
    setSubmitLoading(true);
    setSubmitError("");

    try {
      // Step 1: Create sale (pending) — inventory checked and reserved
      const saleRes = await API.post("/sales", {
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.qty })),
        customer_id: selectedCustomerId || null,
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        grand_total: grandTotal,
      });

      const saleId = saleRes.data.sale_id;
      const selectedCustomer = customers.find(
        (c) => c.customer_id === parseInt(selectedCustomerId)
      );
      const email = selectedCustomer?.email || "customer@swiftpos.com";

      // ── CASH ───────────────────────────────────────────────────────────────
      if (paymentMethod === "cash") {
        await completeSale(saleId, [{ method: "cash", amount: grandTotal }]);
        return;
      }

      // ── CARD ───────────────────────────────────────────────────────────────
      if (paymentMethod === "card") {
        try {
          const reference = await openPaystackPopup({
            saleId, amountCedis: grandTotal, email, channel: "card",
          });
          await completeSale(saleId, [{ method: "card", amount: grandTotal, reference }]);
        } catch (err) {
          setSubmitError(err.message);
        }
        return;
      }

      // ── MOBILE MONEY ────────────────────────────────────────────────────────
      if (paymentMethod === "momo") {
        try {
          const reference = await openPaystackPopup({
            saleId, amountCedis: grandTotal, email, channel: "momo",
          });
          await completeSale(saleId, [{ method: "mobile_money", amount: grandTotal, reference }]);
        } catch (err) {
          setSubmitError(err.message);
        }
        return;
      }

      // ── SPLIT ───────────────────────────────────────────────────────────────
      if (paymentMethod === "split") {
        const cashAmt = parseFloat(splitCash) || 0;
        const momoAmt = parseFloat(splitMomo) || 0;
        const cardAmt = parseFloat(splitCard) || 0;

        const paymentsPayload = [];
        if (cashAmt > 0) paymentsPayload.push({ method: "cash", amount: cashAmt });

        try {
          if (momoAmt > 0) {
            const momoRef = await openPaystackPopup({
              saleId, amountCedis: momoAmt, email, channel: "momo",
            });
            paymentsPayload.push({ method: "mobile_money", amount: momoAmt, reference: momoRef });
          }

          if (cardAmt > 0) {
            const cardRef = await openPaystackPopup({
              saleId, amountCedis: cardAmt, email, channel: "card",
            });
            paymentsPayload.push({ method: "card", amount: cardAmt, reference: cardRef });
          }

          await completeSale(saleId, paymentsPayload);
        } catch (err) {
          setSubmitError(err.message || "Payment failed. Please try again.");
        }
        return;
      }

    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to process sale. Please try again."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Void ────────────────────────────────────────────────────────────────────
  const handleVoid = async () => {
    setVoidLoading(true);
    try {
      await API.put(`/sales/void/${voidId}`);
      setVoidId(null);
      await fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to void sale.");
    } finally {
      setVoidLoading(false);
    }
  };

  const closeSaleModal = () => {
    setShowSaleModal(false);
    setShowCheckout(false);
    setCart([]);
    setDiscountValue("");
    setPaymentMethod("");
    setSelectedCustomerId("");
    setSubmitError("");
    setSearch("");
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="sales-container">

      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} className="sidebar-logo" alt="SwiftPOS" />
        <ul className="menu">
          <li onClick={() => navigate("/dashboard")}><span className="menu-icon">⊞</span> Dashboard</li>
          <li onClick={() => navigate("/products")}><span className="menu-icon">🛒</span> Products</li>
          <li onClick={() => navigate("/inventory")}><span className="menu-icon">📦</span> Inventory</li>
          <li className="active"><span className="menu-icon">📊</span> Sales</li>
          <li onClick={() => navigate("/customers")}><span className="menu-icon">👥</span> Customers</li>
          <li onClick={() => navigate("/analytics")}><span className="menu-icon">📈</span> Analytics</li>
        </ul>
        <div className="user" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || "U"}</div>
          <div className="user-info">
            <p>{user?.name || "User"}</p>
            <span>{user?.role || "Role"}</span>
          </div>
          <span className="logout-icon">⏻</span>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <h2 className="page-title">Sales</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {lastSaleReceipt && (
              <button className="receipt-btn" onClick={() => setShowReceipt(true)}>
                🧾 Last Receipt
              </button>
            )}
            <button className="add-sale-btn" onClick={() => setShowSaleModal(true)}>
              + Add Sale
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {loadingSales ? (
            <div className="empty-state"><p className="empty-text">Loading sales...</p></div>
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🧾</p>
              <p className="empty-text">No sales yet. Click <strong>+ Add Sale</strong> to get started.</p>
            </div>
          ) : (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={sale.sale_id}>
                    <td>{index + 1}</td>
                    <td>{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="total-cell">₵{parseFloat(sale.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`payment-badge ${
                        sale.status === "voided"    ? "badge-voided"    :
                        sale.status === "completed" ? "badge-completed" : "badge-pending"
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td>
                      {sale.status !== "voided" && (
                        <button className="void-btn" onClick={() => setVoidId(sale.sale_id)}>
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Sale Modal */}
      {showSaleModal && !showCheckout && (
        <div className="modal-overlay" onClick={closeSaleModal}>
          <div className="sale-modal" onClick={(e) => e.stopPropagation()}>

            {/* Left — Product Picker */}
            <div className="product-picker">
              <h3>Select Products</h3>
              <input
                className="product-search" type="text"
                placeholder="🔍 Search products..."
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
              <div className="product-grid">
                {filtered.map((p) => (
                  <div className="product-card" key={p.product_id} onClick={() => addToCart(p)}>
                    <span className="product-card-emoji">{categoryEmojis[p.category] || "🛒"}</span>
                    <span className="product-card-name">{p.product_name}</span>
                    <span className="product-card-price">₵{parseFloat(p.price).toFixed(2)}</span>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p style={{ color: "#aaa", fontSize: "13px", padding: "10px" }}>No products found.</p>
                )}
              </div>
            </div>

            {/* Right — Cart */}
            <div className="cart-panel">
              <h3>Cart</h3>
              <div className="cart-customer">
                <label>Customer (optional)</label>
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="customer-select">
                  <option value="">-- Walk-in customer --</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.name} ({c.loyalty_points || 0} pts)
                    </option>
                  ))}
                </select>
              </div>

              {cart.length === 0 ? (
                <p className="cart-empty">No items added yet.</p>
              ) : (
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.product_id}>
                      <span className="cart-item-name">
                        {categoryEmojis[item.category] || "🛒"} {item.product_name}
                      </span>
                      <div className="cart-item-controls">
                        <button onClick={() => updateQty(item.product_id, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.product_id, item.qty + 1)}>+</button>
                      </div>
                      <span className="cart-item-price">₵{(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                      <button className="cart-remove" onClick={() => removeFromCart(item.product_id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="discount-section">
                <p className="section-label">Discount</p>
                <div className="discount-row">
                  <div className="discount-type-toggle">
                    <button className={discountType === "percent" ? "toggle-active" : ""} onClick={() => setDiscountType("percent")}>%</button>
                    <button className={discountType === "fixed" ? "toggle-active" : ""} onClick={() => setDiscountType("fixed")}>₵</button>
                  </div>
                  <input type="number" min="0"
                    placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 5.00"}
                    value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                    className="discount-input"
                  />
                </div>
              </div>

              <div className="tax-row">
                <label className="tax-label">Apply TAX ({(TAX_RATE * 100).toFixed(0)}%)</label>
                <button className={`tax-toggle ${applyTax ? "tax-on" : "tax-off"}`} onClick={() => setApplyTax(!applyTax)}>
                  {applyTax ? "On" : "Off"}
                </button>
              </div>

              <div className="cart-totals">
                <div className="totals-row"><span>Subtotal</span><span>₵{subtotal.toFixed(2)}</span></div>
                {discountAmount > 0 && (
                  <div className="totals-row discount-row-display">
                    <span>Discount ({discountType === "percent" ? `${discountValue}%` : `₵${discountValue}`})</span>
                    <span>−₵{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {applyTax && (
                  <div className="totals-row">
                    <span>VAT ({(TAX_RATE * 100).toFixed(0)}%)</span>
                    <span>+₵{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="totals-row grand-total-row">
                  <span>Total</span><span>₵{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button className="cancel-btn" onClick={closeSaleModal}>Cancel</button>
                <button
                  className="checkout-btn"
                  onClick={() => { if (cart.length > 0) { setSubmitError(""); setShowCheckout(true); } }}
                  disabled={cart.length === 0}
                >
                  Checkout
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Checkout</h3>

            <div className="order-summary">
              {cart.map((item) => (
                <div className="summary-row" key={item.product_id}>
                  <span>{categoryEmojis[item.category] || "🛒"} {item.product_name} x{item.qty}</span>
                  <span>₵{(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="summary-divider" />
              <div className="summary-row"><span>Subtotal</span><span>₵{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="summary-row summary-discount">
                  <span>Discount</span><span>−₵{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {applyTax && (
                <div className="summary-row">
                  <span>VAT ({(TAX_RATE * 100).toFixed(0)}%)</span>
                  <span>+₵{taxAmount.toFixed(2)}</span>
                </div>
              )}
              {selectedCustomerId && (
                <div className="summary-row loyalty-info">
                  <span>Loyalty points earned: +{Math.floor(grandTotal / 10)} pts</span>
                </div>
              )}
              <div className="summary-total">
                <span>Total</span><span>₵{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {submitError && <p className="modal-error">{submitError}</p>}

            <p className="payment-label">Select Payment Method</p>
            <div className="payment-options">
              {[
                { key: "cash",  label: "💵 Cash" },
                { key: "momo",  label: "📱 Mobile Money" },
                { key: "card",  label: "💳 Card" },
                { key: "split", label: "✂️ Split" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`payment-option ${paymentMethod === key ? "selected" : ""}`}
                  onClick={() => { setPaymentMethod(key); setSubmitError(""); }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Cash */}
            {paymentMethod === "cash" && (
              <div className="payment-fields">
                <label>Cash Tendered</label>
                <input
                  type="number"
                  placeholder={`Min. ₵${grandTotal.toFixed(2)}`}
                  min={grandTotal}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                />
                {parseFloat(cashTendered) >= grandTotal && (
                  <div className="change-display">
                    Change: <strong>₵{cashChange.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}

            {/* MoMo */}
            {paymentMethod === "momo" && (
              <div className="payment-fields">
                <label>Customer MoMo Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0551234567"
                  value={momoNumber}
                  onChange={(e) => { setMomoNumber(e.target.value); setSubmitError(""); }}
                />
                <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                  📱 A Paystack popup will open to complete the mobile money payment of ₵{grandTotal.toFixed(2)}.
                </p>
              </div>
            )}

            {/* Card */}
            {paymentMethod === "card" && (
              <div className="payment-fields">
                <p style={{ fontSize: "13px", color: "#555", margin: "8px 0" }}>
                  💳 A secure Paystack popup will open to collect card details.
                </p>
              </div>
            )}

            {/* Split */}
            {paymentMethod === "split" && (
              <div className="payment-fields split-fields">
                <p className="split-note">Total: <strong>₵{grandTotal.toFixed(2)}</strong></p>
                <label>Cash (₵)</label>
                <input type="number" min="0" placeholder="0.00"
                  value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
                <label>Mobile Money (₵)</label>
                <input type="number" min="0" placeholder="0.00"
                  value={splitMomo} onChange={(e) => setSplitMomo(e.target.value)} />
                {parseFloat(splitMomo) > 0 && (
                  <>
                    <label>MoMo Number</label>
                    <input type="tel" placeholder="e.g. 0551234567"
                      value={splitMomoNumber} onChange={(e) => setSplitMomoNumber(e.target.value)} />
                  </>
                )}
                <label>Card (₵)</label>
                <input type="number" min="0" placeholder="0.00"
                  value={splitCard} onChange={(e) => setSplitCard(e.target.value)} />
                <div className={`split-summary ${splitRemaining > 0 ? "split-short" : "split-ok"}`}>
                  {splitRemaining > 0
                    ? `Still needed: ₵${splitRemaining.toFixed(2)}`
                    : `✓ Covered — change: ₵${(splitPaid - grandTotal).toFixed(2)}`}
                </div>
                {(parseFloat(splitMomo) > 0 || parseFloat(splitCard) > 0) && (
                  <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                    📱 Paystack popup will open for the electronic portion
                    (₵{((parseFloat(splitMomo) || 0) + (parseFloat(splitCard) || 0)).toFixed(2)}).
                  </p>
                )}
              </div>
            )}

            <div className="cart-actions">
              <button className="cancel-btn" onClick={() => setShowCheckout(false)}>
                Back
              </button>
              <button
                className="checkout-btn"
                onClick={handlePayment}
                disabled={submitLoading}
              >
                {submitLoading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSaleReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <p className="receipt-brand">SwiftPOS</p>
              <p className="receipt-sub">Sales Receipt</p>
              <p className="receipt-meta">{lastSaleReceipt.date} · {lastSaleReceipt.time}</p>
            </div>
            <div className="receipt-items">
              {lastSaleReceipt.items.map((item, i) => (
                <div className="receipt-line" key={i}>
                  <span>{item.emoji} {item.name} x{item.qty}</span>
                  <span>₵{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="receipt-divider" />
            <div className="receipt-line"><span>Subtotal</span><span>₵{lastSaleReceipt.subtotal.toFixed(2)}</span></div>
            {lastSaleReceipt.discountAmount > 0 && (
              <div className="receipt-line receipt-discount">
                <span>Discount</span><span>−₵{lastSaleReceipt.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {lastSaleReceipt.taxAmount > 0 && (
              <div className="receipt-line">
                <span>VAT ({(lastSaleReceipt.taxRate * 100).toFixed(0)}%)</span>
                <span>+₵{lastSaleReceipt.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="receipt-divider" />
            <div className="receipt-line receipt-total">
              <span>Total</span><span>₵{lastSaleReceipt.grandTotal.toFixed(2)}</span>
            </div>
            <div className="receipt-line receipt-payment">
              <span>Payment</span><span>{lastSaleReceipt.payment}</span>
            </div>
            {lastSaleReceipt.cashTendered !== null && (
              <>
                <div className="receipt-line"><span>Cash Tendered</span><span>₵{lastSaleReceipt.cashTendered.toFixed(2)}</span></div>
                <div className="receipt-line"><span>Change</span><span>₵{lastSaleReceipt.cashChange.toFixed(2)}</span></div>
              </>
            )}
            {lastSaleReceipt.splitCash !== null && (
              <>
                {lastSaleReceipt.splitCash > 0 && <div className="receipt-line"><span>— Cash</span><span>₵{lastSaleReceipt.splitCash.toFixed(2)}</span></div>}
                {lastSaleReceipt.splitMomo > 0 && <div className="receipt-line"><span>— Mobile Money</span><span>₵{lastSaleReceipt.splitMomo.toFixed(2)}</span></div>}
                {lastSaleReceipt.splitCard > 0 && <div className="receipt-line"><span>— Card</span><span>₵{lastSaleReceipt.splitCard.toFixed(2)}</span></div>}
              </>
            )}
            <div className="receipt-footer"><p>Thank you for your purchase!</p></div>
            <button className="cancel-btn" style={{ marginTop: "8px" }} onClick={() => setShowReceipt(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Void Confirmation */}
      {voidId && (
        <div className="modal-overlay" onClick={() => setVoidId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "360px" }}>
            <h3>Void Sale</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              Are you sure you want to void this sale? Inventory will be restored and loyalty points reversed.
            </p>
            <div className="modal-actions" style={{ marginTop: "12px" }}>
              <button className="cancel-btn" onClick={() => setVoidId(null)}>Cancel</button>
              <button
                className="confirm-btn"
                style={{ background: "#eb5757" }}
                onClick={handleVoid}
                disabled={voidLoading}
              >
                {voidLoading ? "Voiding..." : "Void Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="success-toast">✅ Sale completed successfully!</div>
      )}

    </div>
  );
}

export default Sales;