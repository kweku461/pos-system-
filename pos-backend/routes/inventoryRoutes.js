const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
  getInventory,
  restockProduct,
  updateStock
} = require("../controllers/inventoryController");

router.get(
  "/",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  getInventory
);

router.put(
  "/restock/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  restockProduct
);

// New route — sets exact quantity
router.put(
  "/update/:id",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  updateStock
);

module.exports = router;