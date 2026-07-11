import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  FiBell, FiArrowUpRight, FiDollarSign, FiShoppingBag,
  FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiUsers,
  FiPackage, FiMinus,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const todayRevenue = summary ? parseFloat(summary.total_revenue) : 0;
  const totalSales   = summary ? summary.total_sales : 0;
  const totalCustomers = summary ? summary.total_customers : 0;

  // ── Profit trend ───────────────────────────────────────────────────────────
  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].revenue > chartData[chartData.length - 2].revenue
      ? "up" : "down"
    : "flat";

  const rangeOptions = [
    { value: "weekly",  label: "This Week"  },
    { value: "monthly", label: "This Month" },
    { value: "yearly",  label: "This Year"  },
  ];

  return (
    <div className="app-shell">
      <Sidebar />

      {/* Main Content */}
      <div className="main">

        {/* Header */}
        <div className="header panel">
          <div>
            <h2 className="page-title">Dashboard</h2>
            <p className="page-sub">Welcome back, {user?.name?.split(" ")[0] || "there"}</p>
          </div>
          <div className="header-icons">
            <button
              className="icon-btn"
              title={lowStock.count > 0 ? `${lowStock.count} low stock alerts` : "No alerts"}
              onClick={() => navigate('/inventory')}
              style={{ position: "relative" }}
            >
              <FiBell />
              {lowStock.count > 0 && (
                <span className="notif-badge">{lowStock.count}</span>
              )}
            </button>
            <button
              className="icon-btn"
              onClick={() => navigate('/analytics')}
              title="View analytics"
            >
              <FiTrendingUp />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="main-scroll">

          {loading ? (
            <p className="status-msg">Loading dashboard...</p>
          ) : (
            <>

              {/* Top Stat Cards */}
              <div className="cards">
                <div className="stat-card panel">
                  <span className="stat-icon blue"><FiDollarSign /></span>
                  <div>
                    <p className="stat-label">{rangeOptions.find(r => r.value === range)?.label} Sales</p>
                    <h3 className="stat-value">
                      ₵{todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>

                <div className="stat-card panel">
                  <span className="stat-icon green"><FiShoppingBag /></span>
                  <div>
                    <p className="stat-label">Transactions</p>
                    <h3 className="stat-value">{totalSales}</h3>
                  </div>
                </div>

                <div className="stat-card panel">
                  <span className={`stat-icon ${lowStock.count > 0 ? "red" : "green"}`}>
                    <FiAlertTriangle />
                  </span>
                  <div>
                    <p className="stat-label">Low Stock Alerts</p>
                    <div className="stat-bottom-row">
                      <h3 className="stat-value">{lowStock.count}</h3>
                      <span className="stat-sub">
                        {lowStock.items.length > 0 ? lowStock.items[0].name : "All good"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Section */}
              <div className="middle">

                {/* Revenue Chart */}
                <div className="chart panel">
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
                        <FiArrowUpRight />
                      </button>
                    </div>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="chart-empty">No sales data for this period</div>
                  ) : (
                    <div style={{ marginTop: "12px" }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v) => [`₵${parseFloat(v).toLocaleString()}`, "Revenue"]}
                            contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                            cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                          />
                          <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Business Data */}
                <div className="business panel">
                  <div className="section-header">
                    <h3>Business Data</h3>
                  </div>

                  <div className="box">
                    <span className="box-icon blue"><FiUsers /></span>
                    <div>
                      <p>Customers</p>
                      <h4>{totalCustomers}</h4>
                    </div>
                  </div>

                  <div className="box">
                    <span className="box-icon orange"><FiPackage /></span>
                    <div>
                      <p>Total Products</p>
                      <h4>{totalProducts}</h4>
                    </div>
                  </div>

                  <div className="box">
                    <span className={`box-icon ${trend === "up" ? "green" : trend === "down" ? "red" : "gray"}`}>
                      {trend === "up" ? <FiTrendingUp /> : trend === "down" ? <FiTrendingDown /> : <FiMinus />}
                    </span>
                    <div>
                      <p>Revenue Trend</p>
                      <h4 style={{ fontSize: "14px" }}>
                        {trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Not enough data"}
                      </h4>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom — Top Selling Products */}
              <div className="bottom panel">
                <div className="section-header">
                  <h3>Top Selling Products</h3>
                  <button
                    className="icon-btn small"
                    onClick={() => navigate('/analytics')}
                    title="View full analytics"
                  >
                    View all <FiArrowUpRight />
                  </button>
                </div>
                {topProducts.length === 0 ? (
                  <p className="status-msg" style={{ textAlign: "left", padding: "12px 0" }}>
                    No sales data yet.
                  </p>
                ) : (
                  <ul>
                    {topProducts.map((p) => (
                      <li key={p.rank}>
                        <span className="top-product-name">
                          <span className="rank-chip">{p.rank}</span> {p.name}
                        </span>
                        <span className="top-product-meta">
                          <span className="top-product-units">{p.units_sold} units</span>
                          <span className="top-product-revenue">
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
