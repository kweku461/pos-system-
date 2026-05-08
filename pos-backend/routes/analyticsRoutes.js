const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  getSummary,
  getChartData,
  getTopProducts,
  getPaymentMethods,
  getLowStock,
} = require("../controllers/analyticsController");

// All analytics routes — Admin and Manager only
router.get("/summary",         authenticateToken, authorizeRole("Admin", "Manager"), getSummary);
router.get("/chart",           authenticateToken, authorizeRole("Admin", "Manager"), getChartData);
router.get("/top-products",    authenticateToken, authorizeRole("Admin", "Manager"), getTopProducts);
router.get("/payment-methods", authenticateToken, authorizeRole("Admin", "Manager"), getPaymentMethods);
router.get("/low-stock",       authenticateToken, authorizeRole("Admin", "Manager"), getLowStock);

module.exports = router;