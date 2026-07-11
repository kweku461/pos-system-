import "../styles/products.css";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import API from "../api/axios";
import {
  FiSearch, FiPlus, FiGrid, FiTag, FiBox, FiTrash2, FiEdit2,
} from "react-icons/fi";

const initialCategories = ["All", "Drinks", "Foodstuffs", "Biscuits"];

function Products() {
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
        const newCats = backendCats.filter(c => c && !prev.includes(c));
        return [...prev, ...newCats];
      });
    } catch {
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
      (c) => c.toLowerCase() === newCategory.toLowerCase()
    );
    if (exists) {
      alert("Category already exists!");
      return;
    }
    setCategories([...categories, newCategory]);
    setNewCategory("");
    setShowCategoryModal(false);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      {/* Main */}
      <div className="main">

        {/* Top Bar */}
        <div className="topbar">
          <div>
            <h2 className="page-title">Products</h2>
            <p className="page-sub">{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
          </div>
          <div className="search-wrap">
            <span className="search-icon"><FiSearch /></span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="add-category-btn"
            onClick={() => setShowCategoryModal(true)}
          >
            <FiPlus /> Category
          </button>
          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <FiPlus /> Add Product
          </button>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill ${activeCategory === cat ? "pill-active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span className="pill-icon">{cat === "All" ? <FiGrid /> : <FiTag />}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Loading / Error states */}
        {loading && <p className="status-msg">Loading products...</p>}
        {error && <p className="status-msg error">{error}</p>}

        {/* Product List */}
        {!loading && !error && (
          <div className="product-list panel">
            {filtered.map((product) => (
              <div className="product-item" key={product.product_id}>
                <span className="product-thumb"><FiBox /></span>
                <div className="product-info">
                  <span className="product-name">{product.product_name}</span>
                  <span className="product-category">{product.category || "Uncategorized"}</span>
                </div>
                <span className="product-price">
                  ₵{parseFloat(product.price).toFixed(2)}
                </span>
                <div className="product-actions">
                  <button
                    className="row-action-btn"
                    onClick={() => setEditProduct({ ...product })}
                    title="Edit product"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="row-action-btn danger"
                    onClick={() => { setDeleteId(product.product_id); setDeleteError(""); }}
                    title="Delete product"
                  >
                    <FiTrash2 />
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
                {categories.filter(c => c !== "All").map((c) => (
                  <option key={c}>{c}</option>
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
            <p className="modal-hint" style={{ marginTop: 0 }}>
              Are you sure you want to delete this product? This cannot be undone.
            </p>
            {deleteError && <p className="modal-error">{deleteError}</p>}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setDeleteId(null); setDeleteError(""); }}>
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
                {categories.filter(c => c !== "All").map((c) => (
                  <option key={c}>{c}</option>
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
