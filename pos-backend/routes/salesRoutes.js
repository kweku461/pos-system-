const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  createSale,
  getSales,
  voidSale,
  getSaleById
} = require("../controllers/salesController");

router.post(
  "/",
  authenticateToken,
  authorizeRole("Admin", "Manager", "Cashier"),
  createSale
);

// ✅ GET / must come before GET /:id — and Cashier added
router.get(
  "/",
  authenticateToken,
  authorizeRole("Admin", "Manager", "Cashier"),
  getSales
);

// ✅ void route before /:id to prevent "void" being treated as an id
router.put(
  "/void/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  voidSale
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  getSaleById
);

module.exports = router;