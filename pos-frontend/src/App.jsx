import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'
import Unauthorized from './pages/Unauthorized'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* All logged-in roles */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["Admin", "Manager", "Cashier"]}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute allowedRoles={["Admin", "Manager", "Cashier"]}>
          <Sales />
        </ProtectedRoute>
      } />

      {/* Admin and Manager only */}
      <Route path="/products" element={
        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
          <Products />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
          <Inventory />
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
          <Customers />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
          <Analytics />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App