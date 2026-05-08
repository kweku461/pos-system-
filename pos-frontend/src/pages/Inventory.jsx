import "../styles/inventory.css";
import logo from "../assets/swiftpos-logo.jpeg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

function Inventory() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Update Stock Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateProductId, setUpdateProductId] = useState("");
  const [updateQty, setUpdateQty] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProductId, setRestockProductId] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restockError, setRestockError] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/inventory");
      const withStatus = res.data.map((item) => ({
        ...item,
        status: item.quantity <= 15 ? "Low Stock" : "In Stock",
      }));
      setInventory(withStatus);
    } catch (err) {
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Restock — adds quantity to existing stock
  const handleRestock = async () => {
    setRestockError("");
    if (!restockProductId) {
      setRestockError("Please select a product.");
      return;
    }
    if (!restockQty || isNaN(restockQty) || parseInt(restockQty) <= 0) {
      setRestockError("Please enter a valid quantity.");
      return;
    }
    setRestockLoading(true);
    try {
      await API.put(`/inventory/restock/${restockProductId}`, {
        quantity: parseInt(restockQty),
      });
      await fetchInventory();
      setShowRestockModal(false);
      setRestockProductId("");
      setRestockQty("");
    } catch (err) {
      setRestockError(
        err.response?.data?.message || "Failed to restock. Try again."
      );
    } finally {
      setRestockLoading(false);
    }
  };

  // Update Stock — sets quantity to exact value via new endpoint
  const handleUpdateStock = async () => {
    setUpdateError("");
    if (!updateProductId) {
      setUpdateError("Please select a product.");
      return;
    }
    if (!updateQty || isNaN(updateQty) || parseInt(updateQty) < 0) {
      setUpdateError("Please enter a valid stock quantity.");
      return;
    }
    setUpdateLoading(true);
    try {
      await API.put(`/inventory/update/${updateProductId}`, {
        quantity: parseInt(updateQty),
      });
      await fetchInventory();
      setShowUpdateModal(false);
      setUpdateProductId("");
      setUpdateQty("");
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || "Failed to update stock. Try again."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const toggleSort = () => setSortAsc(!sortAsc);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filtered = inventory
    .filter((item) => {
      const matchSearch = item.product_name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchFilter =
        filter === "" ||
        item.status === filter ||
        (item.category &&
          item.category.toLowerCase().includes(filter.toLowerCase()));
      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      sortAsc
        ? a.product_name.localeCompare(b.product_name)
        : b.product_name.localeCompare(a.product_name)
    );

  return (
    <div className="inventory-container">

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
          <li className="active">
            <span className="menu-icon">📦</span> Inventory
          </li>
          <li onClick={() => navigate("/sales")}>
            <span className="menu-icon">📊</span> Sales
          </li>
          <li onClick={() => navigate("/customers")}>
            <span className="menu-icon">👥</span> Customers
          </li>
          <li onClick={() => navigate("/analytics")}>
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

        {/* Top Bar */}
        <div className="topbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Filter</option>
            <option value="Low Stock">Low Stock</option>
            <option value="In Stock">In Stock</option>
            {[...new Set(
              inventory.map((item) => item.category).filter(Boolean)
            )].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="action-btns">
          <button
            className="restock-btn"
            onClick={() => {
              setRestockProductId("");
              setRestockQty("");
              setRestockError("");
              setShowRestockModal(true);
            }}
          >
            Restock
          </button>
          <button
            className="update-btn"
            onClick={() => {
              setUpdateProductId("");
              setUpdateQty("");
              setUpdateError("");
              setShowUpdateModal(true);
            }}
          >
            Update Stock
          </button>
        </div>

        {/* Loading / Error */}
        {loading && <p className="status-msg">Loading inventory...</p>}
        {error && <p className="status-msg error">{error}</p>}

        {/* Table */}
        {!loading && !error && (
          <div className="table-wrap">
            <table
              className="inventory-table"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <thead>
                <tr>
                  <th
                    style={{ width: "25%" }}
                    onClick={toggleSort}
                    className="sortable"
                  >
                    Product Name {sortAsc ? "▲" : "▼"}
                  </th>
                  <th style={{ width: "20%" }}>Category</th>
                  <th style={{ width: "15%" }}>Stock</th>
                  <th style={{ width: "15%" }}>Price</th>
                  <th style={{ width: "25%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.product_id}>
                    <td className="bold">{item.product_name}</td>
                    <td className="muted">{item.category || "—"}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {item.price
                        ? `₵${parseFloat(item.price).toFixed(2)}`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          item.status === "Low Stock"
                            ? "badge-red"
                            : "badge-green"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-results">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showRestockModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRestockModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Restock Product</h3>
            <p style={{ fontSize: "13px", color: "#888", marginTop: "-8px" }}>
              This will add to the existing stock quantity.
            </p>

            {restockError && <p className="modal-error">{restockError}</p>}

            <div className="modal-field">
              <label>Select Product</label>
              <select
                value={restockProductId}
                onChange={(e) => {
                  setRestockProductId(e.target.value);
                  setRestockError("");
                }}
              >
                <option value="">-- Select a product --</option>
                {inventory.map((item) => (
                  <option key={item.product_id} value={item.product_id}>
                    {item.product_name} (Current stock: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label>Quantity to Add</label>
              <input
                type="number"
                placeholder="e.g. 10"
                min="1"
                value={restockQty}
                onChange={(e) => {
                  setRestockQty(e.target.value);
                  setRestockError("");
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowRestockModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleRestock}
                disabled={restockLoading}
              >
                {restockLoading ? "Restocking..." : "Restock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUpdateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Stock</h3>
            <p style={{ fontSize: "13px", color: "#888", marginTop: "-8px" }}>
              This will set the stock to the exact quantity you enter.
            </p>

            {updateError && <p className="modal-error">{updateError}</p>}

            <div className="modal-field">
              <label>Select Product</label>
              <select
                value={updateProductId}
                onChange={(e) => {
                  setUpdateProductId(e.target.value);
                  setUpdateError("");
                }}
              >
                <option value="">-- Select a product --</option>
                {inventory.map((item) => (
                  <option key={item.product_id} value={item.product_id}>
                    {item.product_name} (Current stock: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label>New Stock Quantity</label>
              <input
                type="number"
                placeholder="Enter exact quantity"
                min="0"
                value={updateQty}
                onChange={(e) => {
                  setUpdateQty(e.target.value);
                  setUpdateError("");
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleUpdateStock}
                disabled={updateLoading}
              >
                {updateLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Inventory;