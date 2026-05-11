const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const app = express();
const authenticateToken = require("./middleware/authMiddleware");
const authorizeRole = require("./middleware/roleMiddleware");

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://pos-system-pos-frontend.onrender.com",
      process.env.FRONTEND_URL,
    ].filter(Boolean); // removes undefined if FRONTEND_URL not set

    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

/* ---------------- ROOT ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("POS API is running");
});

/* ---------------- DATABASE TEST ---------------- */
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database connection error");
  }
});

/* ---------------- IMPORT ROUTES ---------------- */
const authRoutes      = require("./routes/authRoutes");
const productRoutes   = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const salesRoutes     = require("./routes/salesRoutes");
const customerRoutes  = require("./routes/customerRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

/* ---------------- ROUTE MIDDLEWARE ---------------- */
app.use("/api/auth",      authRoutes);
app.use("/api/products",  productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales",     salesRoutes);
app.use("/api/customers", customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

/* ---------------- AUTH TEST ROUTES ---------------- */
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

app.get("/admin-only",
  authenticateToken,
  authorizeRole("Admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

app.get("/manager-report",
  authenticateToken,
  authorizeRole("Admin", "Manager"),
  (req, res) => {
    res.json({ message: "Reports accessible" });
  }
);

app.get("/sales-test",
  authenticateToken,
  authorizeRole("Admin", "Manager", "Cashier"),
  (req, res) => {
    res.json({ message: "Sales system accessed" });
  }
);

/* ---------------- START SERVER ---------------- */
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});

module.exports = app;