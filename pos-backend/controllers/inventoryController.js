const pool = require("../config/db");

exports.getInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.category,
        p.price,
        i.quantity
      FROM products p
      JOIN inventory i ON p.product_id = i.product_id
      ORDER BY p.product_name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving inventory" });
  }
};

exports.restockProduct = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    try {
        const result = await pool.query(
            `UPDATE inventory 
             SET quantity = quantity + $1 
             WHERE product_id = $2 
             RETURNING *`,
            [quantity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product restocked successfully", product: result.rows[0] });

    } catch (error) {
        res.status(500).json({ message: "Error restocking product" });
    }
};

exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const result = await pool.query(
      `UPDATE inventory 
       SET quantity = $1 
       WHERE product_id = $2 
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ 
      message: "Stock updated successfully", 
      product: result.rows[0] 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating stock" });
  }
};