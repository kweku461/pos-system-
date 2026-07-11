import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid, FiTag, FiPackage, FiShoppingCart,
  FiUsers, FiBarChart2, FiLogOut, FiZap,
} from "react-icons/fi";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: <FiGrid />,      roles: ["Admin", "Manager", "Cashier"] },
  { path: "/sales",     label: "Sales",     icon: <FiShoppingCart />, roles: ["Admin", "Manager", "Cashier"] },
  { path: "/products",  label: "Products",  icon: <FiTag />,       roles: ["Admin", "Manager"] },
  { path: "/inventory", label: "Inventory", icon: <FiPackage />,   roles: ["Admin", "Manager"] },
  { path: "/customers", label: "Customers", icon: <FiUsers />,     roles: ["Admin", "Manager"] },
  { path: "/analytics", label: "Analytics", icon: <FiBarChart2 />, roles: ["Admin", "Manager"] },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><FiZap /></span>
        <span className="brand-name">SwiftPOS</span>
      </div>

      <ul className="nav">
        {visibleItems.map((item) => (
          <li
            key={item.path}
            className={location.pathname === item.path ? "active" : ""}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="user-info">
            <p>{user?.name || "User"}</p>
            <span>{user?.role || "Role"}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut /> Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
