const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


router.post(
    "/",
    authenticateToken,
    authorizeRole("Admin"),
    createProduct
);

router.get(
    "/",
    authenticateToken,
    getProducts
);

router.put(
    "/:id",
    authenticateToken,
    authorizeRole("Admin"),
    updateProduct
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("Admin"),
    deleteProduct
);

module.exports = router;