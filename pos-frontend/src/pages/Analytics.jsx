import "../styles/analytics.css";
import logo from "../assets/swiftpos-logo.jpeg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart,
  Pie, Cell,
} from "recharts";

const COLORS = ["#2f80ed", "#27ae60", "#f2994a", "#eb5757", "#8e44ad"];

const PAYMENT_LABELS = {
  cash: "Cash",
  card: "Card",
  mobile_money: "Mobile Money",
  split: "Split",
};

function Analytics() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeRange, setActiveRange] = useState("monthly");

  // Data state
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [lowStock, setLowStock] = useState({ count: 0, items: [], threshold: 5 });
  const [showLowStock, setShowLowStock] = useState(false);

  // Loading / error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch everything when range changes
  useEffect(() => {
    fetchAll(activeRange);
  }, [activeRange]);

  const fetchAll = async (range) => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, chartRes, topRes, paymentRes, stockRes] = await Promise.all([
        API.get(`/analytics/summary?range=${range}`),
        API.get(`/analytics/chart?range=${range}`),
        API.get("/analytics/top-products"),
        API.get("/analytics/payment-methods"),
        API.get("/analytics/low-stock"),
      ]);

      setSummary(summaryRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
      setPaymentMethods(paymentRes.data.map((p) => ({
        ...p,
        name: PAYMENT_LABELS[p.name] || p.name,
      })));
      setLowStock(stockRes.data);

    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const rangeLabel = {
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year",
  }[activeRange];

  return (
    <div className="analytics-container">

      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} className="sidebar-logo" alt="SwiftPOS" />
        <ul className="menu">
          <li onClick={() => navigate("/dashboard")}>
            <span className="menu-icon">⊞</span> Dashboard
          </li>
          <li onClick={() => navigate("/products")}>
            <span className="menu-icon">🛒</span> Products
          </li>
          <li onClick={() => navigate("/inventory")}>
            <span className="menu-icon">📦</span> Inventory
          </li>
          <li onClick={() => navigate("/sales")}>
            <span className="menu-icon">📊</span> Sales
          </li>
          <li onClick={() => navigate("/customers")}>
            <span className="menu-icon">👥</span> Customers
          </li>
          <li className="active">
            <span className="menu-icon">📈</span> Analytics
          </li>
        </ul>
        <div className="user" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="user-info">
            <p>{user?.name || "User"}</p>
            <span>{user?.role || "Role"}</span>
          </div>
          <span className="logout-icon">⏻</span>
        </div>
      </div>

      {/* Main */}
      <div className="main">

        {/* Header */}
        <div className="analytics-header">
          <div>
            <h2>Analytics</h2>
            <p>Business performance overview — {rangeLabel}</p>
          </div>
          <div className="range-tabs">
            {["weekly", "monthly", "yearly"].map((r) => (
              <button
                key={r}
                className={`range-tab ${activeRange === r ? "range-active" : ""}`}
                onClick={() => setActiveRange(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {lowStock.count > 0 && (
          <div className="low-stock-banner">
            <span>
              ⚠️ <strong>{lowStock.count} product{lowStock.count > 1 ? "s" : ""}</strong> {lowStock.count > 1 ? "are" : "is"} low on stock (≤{lowStock.threshold} units)
            </span>
            <button
              className="low-stock-toggle"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              {showLowStock ? "Hide" : "View"} →
            </button>
          </div>
        )}

        {/* Low Stock Details */}
        {showLowStock && lowStock.items.length > 0 && (
          <div className="low-stock-panel">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock Left</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.items.map((item, i) => (
                  <tr key={i}>
                    <td className="bold">{item.name}</td>
                    <td>{item.category || "—"}</td>
                    <td>
                      <span className={`stock-badge ${item.quantity === 0 ? "stock-out" : "stock-low"}`}>
                        {item.quantity === 0 ? "Out of stock" : `${item.quantity} left`}
                      </span>
                    </td>
                    <td>{item.last_updated ? new Date(item.last_updated).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="empty-state">
            <p className="empty-text">Loading analytics...</p>
          </div>
        )}
        {error && (
          <div className="empty-state">
            <p className="empty-text" style={{ color: "#eb5757" }}>{error}</p>
          </div>
        )}

        {/* Scrollable Content */}
        {!loading && !error && (
          <div className="analytics-scroll">

            {/* KPI Cards */}
            <div className="kpi-cards">
              <div className="kpi-card blue">
                <p className="kpi-label">Total Revenue</p>
                <h3 className="kpi-value">
                  ₵{summary ? parseFloat(summary.total_revenue).toLocaleString() : "0"}
                </h3>
                <span className="kpi-sub">{rangeLabel}</span>
              </div>
              <div className="kpi-card green">
                <p className="kpi-label">Completed Sales</p>
                <h3 className="kpi-value">{summary?.total_sales ?? 0}</h3>
                <span className="kpi-sub">{rangeLabel}</span>
              </div>
              <div className="kpi-card orange">
                <p className="kpi-label">Avg. Order Value</p>
                <h3 className="kpi-value">
                  ₵{summary ? parseFloat(summary.avg_order_value).toLocaleString() : "0"}
                </h3>
                <span className="kpi-sub">{rangeLabel}</span>
              </div>
              <div className="kpi-card red">
                <p className="kpi-label">Total Customers</p>
                <h3 className="kpi-value">{summary?.total_customers ?? 0}</h3>
                <span className="kpi-sub">
                  {summary?.top_customer
                    ? `Top: ${summary.top_customer.name}`
                    : "No customers yet"}
                </span>
              </div>
            </div>

            {/* Revenue Bar Chart */}
            <div className="chart-card wide">
              <div className="chart-card-header">
                <h3>Revenue Over Time</h3>
                <span className="chart-sub">{rangeLabel} — completed sales only</span>
              </div>
              {chartData.length === 0 ? (
                <p style={{ color: "#aaa", fontSize: "13px", padding: "20px" }}>
                  No completed sales data for this period.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [`₵${parseFloat(value).toLocaleString()}`, "Revenue"]
                          : [value, "Sales"]
                      }
                      contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "13px" }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#2f80ed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales"   name="Sales"   fill="#27ae60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment Methods Pie + Top Products */}
            <div className="charts-row">

              {/* Payment Methods Pie */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3>Payment Methods</h3>
                  <span className="chart-sub">All time</span>
                </div>
                {paymentMethods.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: "13px", padding: "20px" }}>
                    No payment data yet.
                  </p>
                ) : (
                  <div className="pie-wrap">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={paymentMethods}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {paymentMethods.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`₵${parseFloat(value).toFixed(2)}`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      {paymentMethods.map((entry, index) => (
                        <div className="pie-legend-item" key={entry.name}>
                          <span
                            className="pie-dot"
                            style={{ background: COLORS[index % COLORS.length] }}
                          />
                          <span className="pie-label">{entry.name}</span>
                          <span className="pie-value">₵{parseFloat(entry.value).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Sales Line Chart */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3>Sales Trend</h3>
                  <span className="chart-sub">{rangeLabel}</span>
                </div>
                {chartData.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: "13px", padding: "20px" }}>
                    No data for this period.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`₵${parseFloat(value).toLocaleString()}`, "Revenue"]}
                        contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2f80ed"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#2f80ed" }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>

            {/* Top Products Table */}
            <div className="chart-card wide">
              <div className="chart-card-header">
                <h3>Top Selling Products</h3>
                <span className="chart-sub">By units sold — all time</span>
              </div>
              {topProducts.length === 0 ? (
                <p style={{ color: "#aaa", fontSize: "13px", padding: "20px" }}>
                  No product sales data yet.
                </p>
              ) : (
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p) => (
                      <tr key={p.rank}>
                        <td>{p.rank}</td>
                        <td className="bold">{p.name}</td>
                        <td>{p.units_sold}</td>
                        <td className="bold">₵{parseFloat(p.revenue).toLocaleString()}</td>
                        <td>
                          <div className="progress-wrap">
                            <div
                              className="progress-bar"
                              style={{ width: `${p.pct}%` }}
                            />
                            <span className="progress-pct">{p.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Voided Sales Note */}
            {summary?.voided_sales > 0 && (
              <div className="voided-note">
                ℹ️ <strong>{summary.voided_sales}</strong> voided sale{summary.voided_sales > 1 ? "s" : ""} excluded from revenue figures {rangeLabel.toLowerCase()}.
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;