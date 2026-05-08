import "../styles/products.css";
import logo from "../assets/swiftpos-logo.jpeg";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const initialCategories = [
  { label: "All", icon: "⊞" },
  { label: "Drinks", icon: "🍾" },
  { label: "Foodstuffs", icon: "🥗" },
  { label: "Biscuits", icon: "🍪" },
];

const categoryEmojis = {
  Drinks: "🥤",
  Foodstuffs: "🍞",
  Biscuits: "🍪",
};

function Products() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add Product Modal
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", price: "", category: "Drinks", quantity: ""
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Add Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Edit Product Modal
  const [editProduct, setEditProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/products");
      setProducts(res.data);

      const backendCats = [...new Set(res.data.map(p => p.category))];
      setCategories((prev) => {
        const existing = prev.map(c => c.label);
        const newCats = backendCats
          .filter(c => c && !existing.includes(c))
          .map(c => ({ label: c, icon: "🏷️" }));
        return [...prev, ...newCats];
      });
    } catch (err) {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  // Add Product
  const handleAdd = async () => {
    setAddError("");
    if (!newProduct.name || !newProduct.price) {
      setAddError("Please fill in name and price.");
      return;
    }
    setAddLoading(true);
    try {
      await API.post("/products", {
        product_name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity) || 0,
        // FIX: Send null instead of "" — empty string causes a UNIQUE
        // constraint violation on barcode when adding a second product
        barcode: null,
      });
      await fetchProducts();
      setNewProduct({ name: "", price: "", category: "Drinks", quantity: "" });
      setShowModal(false);
    } catch (err) {
      // Log full error to browser console for easier debugging
      console.error("Add product error:", err.response?.status, err.response?.data);
      setAddError(
        err.response?.data?.message || err.message || "Failed to add product. Try again."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // Delete Product
  const handleDelete = async (id) => {
    setDeleteError("");
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.product_id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("Delete product error:", err.response?.status, err.response?.data);
      setDeleteError(
        err.response?.data?.message || "Failed to delete product."
      );
    }
  };

  // Edit Product
  const handleEdit = async () => {
    setEditError("");
    if (!editProduct.product_name || !editProduct.price) {
      setEditError("Please fill in name and price.");
      return;
    }
    setEditLoading(true);
    try {
      await API.put(`/products/${editProduct.product_id}`, {
        product_name: editProduct.product_name,
        category: editProduct.category,
        price: parseFloat(editProduct.price),
        quantity: parseInt(editProduct.quantity) || 0,
      });
      await fetchProducts();
      setEditProduct(null);
    } catch (err) {
      console.error("Edit product error:", err.response?.status, err.response?.data);
      setEditError(
        err.response?.data?.message || "Failed to update product. Try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Add Category (local only)
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const exists = categories.find(
      (c) => c.label.toLowerCase() === newCategory.toLowerCase()
    );
    if (exists) {
      alert("Category already exists!");
      return;
    }
    setCategories([...categories, { label: newCategory, icon: "🏷️" }]);
    setNewCategory("");
    setShowCategoryModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="products-container">

      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} className="sidebar-logo" alt="SwiftPOS" />
        <ul className="menu">
          <li onClick={() => navigate('/dashboard')}>
            <span className="menu-icon">⊞</span> Dashboard
          </li>
          <li className="active">
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
          <select className="categories-select">
            <option>Categories ▾</option>
            {categories.map((c) => (
              <option key={c.label}>{c.label}</option>
            ))}
          </select>
          <button
            className="add-category-btn"
            onClick={() => setShowCategoryModal(true)}
          >
            Add Category +
          </button>
          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            Add Product +
          </button>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={`pill ${activeCategory === cat.label ? "pill-active" : ""}`}
              onClick={() => setActiveCategory(cat.label)}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Loading / Error states */}
        {loading && <p className="status-msg">Loading products...</p>}
        {error && <p className="status-msg error">{error}</p>}

        {/* Product List */}
        {!loading && !error && (
          <div className="product-list">
            {filtered.map((product) => (
              <div className="product-item" key={product.product_id}>
                <span className="product-emoji">
                  {categoryEmojis[product.category] || "🛒"}
                </span>
                <span className="product-name">{product.product_name}</span>
                <span className="product-price">
                  ₵{parseFloat(product.price).toFixed(2)}
                </span>
                <div className="product-actions">
                  <button
                    className="edit-product-btn"
                    onClick={() => setEditProduct({ ...product })}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-product-btn"
                    onClick={() => { setDeleteId(product.product_id); setDeleteError(""); }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="no-results">No products found.</p>
            )}
          </div>
        )}

      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Product</h3>

            {addError && <p className="modal-error">{addError}</p>}

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Price (₵)</label>
              <input
                type="number"
                placeholder="0.00"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Initial Stock Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={newProduct.quantity}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, quantity: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Category</label>
              <select
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              >
                {categories.filter(c => c.label !== "All").map((c) => (
                  <option key={c.label}>{c.label}</option>
                ))}
              </select>
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
                {addLoading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Category</h3>
            <div className="modal-field">
              <label>Category Name</label>
              <input
                type="text"
                placeholder="e.g. Dairy"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowCategoryModal(false)}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAddCategory}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              Are you sure you want to delete this product? This cannot be undone.
            </p>
            {deleteError && (
              <p className="modal-error" style={{ marginTop: "8px" }}>
                {deleteError}
              </p>
            )}
            <div className="modal-actions" style={{ marginTop: "8px" }}>
              <button className="cancel-btn" onClick={() => { setDeleteId(null); setDeleteError(""); }}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                style={{ background: "#eb5757" }}
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Product</h3>

            {editError && <p className="modal-error">{editError}</p>}

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Product name"
                value={editProduct.product_name}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, product_name: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Price (₵)</label>
              <input
                type="number"
                placeholder="0.00"
                value={editProduct.price}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, price: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Stock Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={editProduct.quantity || ""}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, quantity: e.target.value })
                }
              />
            </div>
            <div className="modal-field">
              <label>Category</label>
              <select
                value={editProduct.category}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, category: e.target.value })
                }
              >
                {categories.filter(c => c.label !== "All").map((c) => (
                  <option key={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => { setEditProduct(null); setEditError(""); }}
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

    </div>
  );
}

export default Products;