import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>POS System</h2>

      <Link to="/">Dashboard</Link>
      <Link to="/sales">Sales</Link>
      <Link to="/add-product">Product</Link>
      <Link to="/inventory">Inventory</Link>
      <Link to="/reports">Reports</Link>
    </div>
  );
}

export default Sidebar;
