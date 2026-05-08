const pool = require("../config/db");

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, phone, email, loyalty_points)
       VALUES ($1, $2, $3, 0)
       RETURNING *`,
      [name, phone, email]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating customer" });
  }
};

// GET ALL CUSTOMERS
exports.getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM customers ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving customers" });
  }
};

// GET CUSTOMER BY ID
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM customers WHERE customer_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving customer" });
  }
};

// UPDATE CUSTOMER
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers
       SET name=$1, phone=$2, email=$3
       WHERE customer_id=$4
       RETURNING *`,
      [name, phone, email, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating customer" });
  }
};

// ADD LOYALTY POINTS
exports.addLoyaltyPoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers
       SET loyalty_points = loyalty_points + $1
       WHERE customer_id = $2
       RETURNING *`,
      [points, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({
      message: "Loyalty points added",
      customer: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding loyalty points" });
  }
};

// REDEEM LOYALTY POINTS
exports.redeemLoyaltyPoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  try {
    // Check current points first
    const customer = await pool.query(
      `SELECT loyalty_points FROM customers WHERE customer_id = $1`,
      [id]
    );
    if (customer.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (customer.rows[0].loyalty_points < points) {
      return res.status(400).json({ message: "Insufficient loyalty points" });
    }
    const result = await pool.query(
      `UPDATE customers
       SET loyalty_points = loyalty_points - $1
       WHERE customer_id = $2
       RETURNING *`,
      [points, id]
    );
    res.json({
      message: "Loyalty points redeemed",
      customer: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error redeeming loyalty points" });
  }
};

// DELETE CUSTOMER
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `DELETE FROM customers WHERE customer_id = $1`,
      [id]
    );
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting customer" });
  }
};