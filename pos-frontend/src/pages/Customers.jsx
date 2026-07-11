import "../styles/customers.css";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import API from "../api/axios";
import { FiSearch, FiPlus, FiStar, FiEdit2, FiTrash2 } from "react-icons/fi";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Add Customer Modal
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "", phone: "", email: ""
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit Customer Modal
  const [editCustomer, setEditCustomer] = useState(null);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Loyalty Points Modal
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [loyaltyAction, setLoyaltyAction] = useState("add");
  const [loyaltyError, setLoyaltyError] = useState("");
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/customers");
      setCustomers(res.data);
    } catch {
      setError("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  // Add Customer
  const handleAdd = async () => {
    setAddError("");
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
      setAddError("Please fill in all fields.");
      return;
    }
    setAddLoading(true);
    try {
      await API.post("/customers", newCustomer);
      await fetchCustomers();
      setNewCustomer({ name: "", phone: "", email: "" });
      setShowModal(false);
    } catch (err) {
      setAddError(
        err.response?.data?.message || "Failed to add customer. Try again."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Customer
  const handleEdit = async () => {
    setEditError("");
    if (!editCustomer.name || !editCustomer.phone || !editCustomer.email) {
      setEditError("Please fill in all fields.");
      return;
    }
    setEditLoading(true);
    try {
      await API.put(`/customers/${editCustomer.customer_id}`, {
        name: editCustomer.name,
        phone: editCustomer.phone,
        email: editCustomer.email,
      });
      await fetchCustomers();
      setEditCustomer(null);
    } catch (err) {
      setEditError(
        err.response?.data?.message || "Failed to update customer. Try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Customer
  const handleDelete = async (id) => {
    try {
      await API.delete(`/customers/${id}`);
      setCustomers(customers.filter((c) => c.customer_id !== id));
      setDeleteId(null);
    } catch {
      alert("Failed to delete customer.");
    }
  };

  // Loyalty Points
  const handleLoyalty = async () => {
    setLoyaltyError("");
    if (!loyaltyPoints || isNaN(loyaltyPoints) || parseInt(loyaltyPoints) <= 0) {
      setLoyaltyError("Please enter a valid number of points.");
      return;
    }
    setLoyaltyLoading(true);
    try {
      const endpoint = loyaltyAction === "add"
        ? `/customers/${loyaltyCustomer.customer_id}/add-points`
        : `/customers/${loyaltyCustomer.customer_id}/redeem-points`;
      await API.put(endpoint, { points: parseInt(loyaltyPoints) });
      await fetchCustomers();
      setLoyaltyCustomer(null);
      setLoyaltyPoints("");
    } catch (err) {
      setLoyaltyError(
        err.response?.data?.message || "Failed to update points. Try again."
      );
    } finally {
      setLoyaltyLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      {/* Main */}
      <div className="main">

        {/* Top Bar */}
        <div className="topbar">
          <div>
            <h2 className="page-title">Customers</h2>
            <p className="page-sub">{customers.length} registered customer{customers.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="search-wrap">
            <span className="search-icon"><FiSearch /></span>
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            <FiPlus /> Add Customer
          </button>
        </div>

        {/* Loading / Error */}
        {loading && <p className="status-msg">Loading customers...</p>}
        {error && <p className="status-msg error">{error}</p>}

        {/* Table */}
        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Loyalty Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.customer_id}>
                    <td className="bold">{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email}</td>
                    <td>
                      <span className="points-badge">
                        <FiStar /> {customer.loyalty_points || 0}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns-row">
                        <button
                          className="row-action-btn points"
                          onClick={() => {
                            setLoyaltyCustomer(customer);
                            setLoyaltyPoints("");
                            setLoyaltyAction("add");
                            setLoyaltyError("");
                          }}
                          title="Manage loyalty points"
                        >
                          <FiStar />
                        </button>
                        <button
                          className="row-action-btn"
                          onClick={() => setEditCustomer({ ...customer })}
                          title="Edit customer"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="row-action-btn danger"
                          onClick={() => setDeleteId(customer.customer_id)}
                          title="Delete customer"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-results">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Customer</h3>

            {addError && <p className="modal-error">{addError}</p>}

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 0535630844"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="e.g. name@email.com"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => { setShowModal(false); setAddError(""); }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleAdd}
                disabled={addLoading}
              >
                {addLoading ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <div className="modal-overlay" onClick={() => setEditCustomer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Customer</h3>

            {editError && <p className="modal-error">{editError}</p>}

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                value={editCustomer.name}
                onChange={(e) =>
                  setEditCustomer({ ...editCustomer, name: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Phone Number</label>
              <input
                type="tel"
                value={editCustomer.phone}
                onChange={(e) =>
                  setEditCustomer({ ...editCustomer, phone: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Email</label>
              <input
                type="email"
                value={editCustomer.email}
                onChange={(e) =>
                  setEditCustomer({ ...editCustomer, email: e.target.value })
                }
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => { setEditCustomer(null); setEditError(""); }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleEdit}
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Points Modal */}
      {loyaltyCustomer && (
        <div className="modal-overlay" onClick={() => setLoyaltyCustomer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Loyalty Points</h3>
            <p className="modal-hint">
              {loyaltyCustomer.name} — Current points:{" "}
              <strong>{loyaltyCustomer.loyalty_points || 0}</strong>
            </p>

            {loyaltyError && <p className="modal-error">{loyaltyError}</p>}

            <div className="modal-field">
              <label>Action</label>
              <div className="loyalty-toggle">
                <button
                  className={`toggle-btn ${loyaltyAction === "add" ? "toggle-active" : ""}`}
                  onClick={() => setLoyaltyAction("add")}
                >
                  Add Points
                </button>
                <button
                  className={`toggle-btn ${loyaltyAction === "redeem" ? "toggle-active" : ""}`}
                  onClick={() => setLoyaltyAction("redeem")}
                >
                  Redeem Points
                </button>
              </div>
            </div>

            <div className="modal-field">
              <label>Points</label>
              <input
                type="number"
                placeholder="Enter points"
                min="1"
                value={loyaltyPoints}
                onChange={(e) => {
                  setLoyaltyPoints(e.target.value);
                  setLoyaltyError("");
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setLoyaltyCustomer(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleLoyalty}
                disabled={loyaltyLoading}
              >
                {loyaltyLoading
                  ? "Processing..."
                  : loyaltyAction === "add"
                  ? "Add Points"
                  : "Redeem Points"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Customer</h3>
            <p className="modal-hint" style={{ marginTop: 0 }}>
              Are you sure you want to delete this customer? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                className="confirm-btn danger"
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Customers;
