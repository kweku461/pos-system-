import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import "../styles/dashboard.css";
import logo from "../assets/swiftpos-logo.jpeg";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [range, setRange] = useState("weekly");
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState({ count: 0, items: [] });
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Fetch all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll(range);
  }, [range]);

  const fetchAll = async (r) => {
    setLoading(true);
    try {
      const [summaryRes, chartRes, topRes, stockRes, productsRes] = await Promise.all([
        API.get(`/analytics/summary?range=${r}`),
        API.get(`/analytics/chart?range=${r}`),
        API.get("/analytics/top-products"),
        API.get("/analytics/low-stock"),
        API.get("/products"),
      ]);

      setSummary(summaryRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
      setLowStock(stockRes.data);
      setTotalProducts(productsRes.data.length);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Today's sales from summary (using weekly which includes today) ─────────
  const todayRevenue = summary ? parseFloat(summary.total_revenue) : 0;
  const totalSales   = summary ? summary.total_sales : 0;
  const totalCustomers = summary ? summary.total_customers : 0;

  // ── Profit state label ─────────────────────────────────────────────────────
  const profitState = chartData.length >= 2
    ? chartData[chartData.length - 1].revenue > chartData[chartData.length - 2].revenue
      ? "📈 Profit increasing"
      : "📉 Profit decreasing"
    : "Not enough data";

  const handleLogout = () => { logout(); navigate('/'); };

  const rangeOptions = [
    { value: "weekly",  label: "This Week"  },
    { value: "monthly", label: "This Month" },
    { value: "yearly",  label: "This Year"  },
  ];

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} className="sidebar-logo" alt="SwiftPOS" />
        <ul className="menu">
          <li className="active">
            <span className="menu-icon">⊞</span> Dashboard
          </li>
          <li onClick={() => navigate('/products')}>
            <span className="menu-icon">🛒</span> Products
          </li>
          <li onClick={() => navigate('/inventory')}>
            <span className="menu-icon">📦</span> Inventory
          </li>
          <li onClick={() => navigate('/sales')}>
            <span className="menu-icon">📊</span> Sales
          </li>
          <li onClick={() => navigate('/customers')}>
            <span className="menu-icon">👥</span> Customers
          </li>
          <li onClick={() => navigate('/analytics')}>
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

      {/* Main Content */}
      <div className="main">

        {/* Header */}
        <div className="header">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, {user?.name?.split(" ")[0] || "there"}! 👋</p>
          </div>
          <div className="header-icons">
            {/* Low stock bell — red if alerts exist */}
            <button
              className="icon-btn"
              title={lowStock.count > 0 ? `${lowStock.count} low stock alerts` : "No alerts"}
              onClick={() => navigate('/inventory')}
              style={{ position: "relative" }}
            >
              🔔
              {lowStock.count > 0 && (
                <span className="notif-badge">{lowStock.count}</span>
              )}
            </button>
            <button className="icon-btn" onClick={() => navigate('/analytics')}>📈</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="main-scroll">

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              Loading dashboard...
            </div>
          ) : (
            <>

              {/* Top Cards */}
              <div className="cards">
                <div className="card blue">
                  <p>{rangeOptions.find(r => r.value === range)?.label} Sales</p>
                  <h3>₵{todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>

                <div className="card outline">
                  <p>Transactions</p>
                  <h3>{totalSales}</h3>
                </div>

                <div className="card red">
                  <p>Low Stock Alerts</p>
                  <div className="card-bottom-row">
                    <h3>{lowStock.count}</h3>
                    <span className="card-sub">
                      {lowStock.items.length > 0
                        ? lowStock.items[0].name
                        : "All good ✓"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section */}
              <div className="middle">

                {/* Revenue Chart */}
                <div className="chart">
                  <div className="section-header">
                    <div>
                      <h3>Total Revenue</h3>
                      <p className="section-sub">Completed sales only</p>
                    </div>
                    <div className="section-controls">
                      <select
                        className="week-select"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                      >
                        {rangeOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <button
                        className="icon-btn small"
                        onClick={() => navigate('/analytics')}
                        title="View full analytics"
                      >
                        ↗
                      </button>
                    </div>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="chart-box" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: "13px" }}>
                      No sales data for this period
                    </div>
                  ) : (
                    <div style={{ marginTop: "12px" }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(v) => [`₵${parseFloat(v).toLocaleString()}`, "Revenue"]}
                            contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                          />
                          <Bar dataKey="revenue" fill="#2f80ed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Business Data */}
                <div className="business">
                  <div className="section-header">
                    <h3>Business Data</h3>
                  </div>

                  <div className="box blue-light">
                    <p>Number of Customers</p>
                    <h4>{totalCustomers}</h4>
                  </div>

                  <div className="box orange">
                    <p>Total Products</p>
                    <h4>{totalProducts}</h4>
                  </div>

                  <div className="box green">
                    <p>Analytics State</p>
                    <h4 style={{ fontSize: "14px" }}>{profitState}</h4>
                  </div>
                </div>

              </div>

              {/* Bottom — Top Selling Products */}
              <div className="bottom">
                <div className="section-header">
                  <h3>Top Selling Products</h3>
                  <button
                    className="icon-btn small"
                    onClick={() => navigate('/analytics')}
                    title="View full analytics"
                    style={{ fontSize: "12px" }}
                  >
                    View all ↗
                  </button>
                </div>
                {topProducts.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: "13px", padding: "12px 0" }}>
                    No sales data yet.
                  </p>
                ) : (
                  <ul>
                    {topProducts.map((p) => (
                      <li key={p.rank}>
                        <span>{p.rank}. {p.name}</span>
                        <span style={{ display: "flex", gap: "16px", color: "#555" }}>
                          <span style={{ color: "#888", fontSize: "13px" }}>{p.units_sold} units</span>
                          <span style={{ fontWeight: "600", color: "#2f80ed" }}>
                            ₵{parseFloat(p.revenue).toLocaleString()}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;