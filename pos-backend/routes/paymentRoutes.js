const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const { createPayment, verifyPaystack } = require("../controllers/paymentController");

// POST /api/payments — record and complete a payment
router.post("/", authenticateToken, createPayment);

// POST /api/payments/verify-paystack — verify Paystack reference server-side
router.post("/verify-paystack", authenticateToken, verifyPaystack);

module.exports = router;