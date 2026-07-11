import "../styles/analytics.css";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import API from "../api/axios";
import {
  FiAlertTriangle, FiInfo, FiDollarSign, FiShoppingBag,
  FiBarChart2, FiUsers, FiArrowRight,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart,
  Pie, Cell,
} from "recharts";

// Validated categorical palette (CVD-safe, contrast-checked)
const COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626"];

const PAYMENT_LABELS = {
  cash: "Cash",
  card: "Card",
  mobile_money: "Mobile Money",
  split: "Split",
};

function Analytics() {
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

  const rangeLabel = {
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year",
  }[activeRange];

  return (
    <div className="app-shell">
      <Sidebar />

      {/* Main */}
      <div className="main">

        {/* Header */}
        <div className="analytics-header panel">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="page-sub">Business performance overview — {rangeLabel}</p>
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
            <span className="banner-text">
              <FiAlertTriangle />
              <span>
                <strong>{lowStock.count} product{lowStock.count > 1 ? "s" : ""}</strong> {lowStock.count > 1 ? "are" : "is"} low on stock (≤{lowStock.threshold} units)
              </span>
            </span>
            <button
              className="low-stock-toggle"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              {showLowStock ? "Hide" : "View"} <FiArrowRight />
            </button>
          </div>
        )}

        {/* Low Stock Details */}
        {showLowStock && lowStock.items.length > 0 && (
          <div className="low-stock-panel panel">
            <table className="data-table">
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
                      <span className={`status-badge ${item.quantity === 0 ? "badge-red" : "badge-pending"}`}>
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
            <p className="empty-text" style={{ color: "var(--danger)" }}>{error}</p>
          </div>
        )}

        {/* Scrollable Content */}
        {!loading && !error && (
          <div className="analytics-scroll">

            {/* KPI Cards */}
            <div className="kpi-cards">
              <div className="kpi-card panel">
                <span className="kpi-icon blue"><FiDollarSign /></span>
                <div>
                  <p className="kpi-label">Total Revenue</p>
                  <h3 className="kpi-value">
                    ₵{summary ? parseFloat(summary.total_revenue).toLocaleString() : "0"}
                  </h3>
                  <span className="kpi-sub">{rangeLabel}</span>
                </div>
              </div>
              <div className="kpi-card panel">
                <span className="kpi-icon green"><FiShoppingBag /></span>
                <div>
                  <p className="kpi-label">Completed Sales</p>
                  <h3 className="kpi-value">{summary?.total_sales ?? 0}</h3>
                  <span className="kpi-sub">{rangeLabel}</span>
                </div>
              </div>
              <div className="kpi-card panel">
                <span className="kpi-icon orange"><FiBarChart2 /></span>
                <div>
                  <p className="kpi-label">Avg. Order Value</p>
                  <h3 className="kpi-value">
                    ₵{summary ? parseFloat(summary.avg_order_value).toLocaleString() : "0"}
                  </h3>
                  <span className="kpi-sub">{rangeLabel}</span>
                </div>
              </div>
              <div className="kpi-card panel">
                <span className="kpi-icon purple"><FiUsers /></span>
                <div>
                  <p className="kpi-label">Total Customers</p>
                  <h3 className="kpi-value">{summary?.total_customers ?? 0}</h3>
                  <span className="kpi-sub">
                    {summary?.top_customer
                      ? `Top: ${summary.top_customer.name}`
                      : "No customers yet"}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Bar Chart */}
            <div className="chart-card panel wide">
              <div className="chart-card-header">
                <h3>Revenue Over Time</h3>
                <span className="chart-sub">{rangeLabel} — completed sales only</span>
              </div>
              {chartData.length === 0 ? (
                <p className="chart-empty-text">No completed sales data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "Revenue"
                          ? [`₵${parseFloat(value).toLocaleString()}`, "Revenue"]
                          : [value, "Sales"]
                      }
                      contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid #e2e8f0" }}
                      cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "13px" }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="sales"   name="Sales"   fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment Methods Pie + Sales Trend */}
            <div className="charts-row">

              {/* Payment Methods Pie */}
              <div className="chart-card panel">
                <div className="chart-card-header">
                  <h3>Payment Methods</h3>
                  <span className="chart-sub">All time</span>
                </div>
                {paymentMethods.length === 0 ? (
                  <p className="chart-empty-text">No payment data yet.</p>
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
                            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`₵${parseFloat(value).toFixed(2)}`, name]}
                          contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid #e2e8f0" }}
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

              {/* Sales Trend Line Chart */}
              <div className="chart-card panel">
                <div className="chart-card-header">
                  <h3>Sales Trend</h3>
                  <span className="chart-sub">{rangeLabel}</span>
                </div>
                {chartData.length === 0 ? (
                  <p className="chart-empty-text">No data for this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value) => [`₵${parseFloat(value).toLocaleString()}`, "Revenue"]}
                        contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid #e2e8f0" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>

            {/* Top Products Table */}
            <div className="chart-card panel wide">
              <div className="chart-card-header">
                <h3>Top Selling Products</h3>
                <span className="chart-sub">By units sold — all time</span>
              </div>
              {topProducts.length === 0 ? (
                <p className="chart-empty-text">No product sales data yet.</p>
              ) : (
                <table className="data-table">
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
                        <td className="muted">{p.rank}</td>
                        <td className="bold">{p.name}</td>
                        <td>{p.units_sold}</td>
                        <td className="bold">₵{parseFloat(p.revenue).toLocaleString()}</td>
                        <td>
                          <div className="progress-wrap">
                            <div className="progress-track">
                              <div
                                className="progress-bar"
                                style={{ width: `${p.pct}%` }}
                              />
                            </div>
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
                <FiInfo /> <span><strong>{summary.voided_sales}</strong> voided sale{summary.voided_sales > 1 ? "s" : ""} excluded from revenue figures {rangeLabel.toLowerCase()}.</span>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
