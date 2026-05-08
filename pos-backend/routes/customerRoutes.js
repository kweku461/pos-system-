const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  deleteCustomer
} = require("../controllers/customerController");

router.post(
  "/",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  createCustomer
);

router.get(
  "/",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  getCustomers
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  getCustomerById
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  updateCustomer
);

router.put(
  "/:id/add-points",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  addLoyaltyPoints
);

router.put(
  "/:id/redeem-points",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  redeemLoyaltyPoints
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  deleteCustomer
);

module.exports = router;