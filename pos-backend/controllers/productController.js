const pool = require("../config/db");

exports.createProduct = async (req, res) => {

  const { product_name, category, price, barcode, quantity } = req.body;

  // Validate required fields
  if (!product_name || !price) {
    return res.status(400).json({ message: "product_name and price are required" });
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Create product
    const product = await client.query(
      `INSERT INTO products (product_name, category, price, barcode)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product_name, category, price, barcode || null]
    );

    const productId = product.rows[0].product_id;

    // Create matching inventory record
    await client.query(
      `INSERT INTO inventory (product_id, quantity)
       VALUES ($1, $2)`,
      [productId, quantity || 0]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Product created",
      product: product.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");
    console.error(error);

    // Return the actual DB error so the frontend can show it
    res.status(500).json({ message: error.message || "Error creating product" });

  } finally {

    client.release();

  }

};

exports.getProducts = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        p.product_id,
        p.product_name,
        p.category,
        p.price,
        p.barcode,
        i.quantity
      FROM products p
      JOIN inventory i ON p.product_id = i.product_id
      ORDER BY p.product_id
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Error fetching products" });

  }

};

exports.updateProduct = async (req, res) => {

  const { id } = req.params;
  const { product_name, category, price, quantity } = req.body;

  if (!product_name || !price) {
    return res.status(400).json({ message: "product_name and price are required" });
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // FIX: Update products table (no quantity column here)
    const updated = await client.query(
      `UPDATE products
       SET product_name = $1, category = $2, price = $3
       WHERE product_id = $4
       RETURNING *`,
      [product_name, category, price, id]
    );

    if (updated.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    // FIX: Update quantity separately in inventory table where it belongs
    await client.query(
      `UPDATE inventory
       SET quantity = $1
       WHERE product_id = $2`,
      [quantity || 0, id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Product updated",
      product: updated.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: error.message || "Error updating product" });

  } finally {

    client.release();

  }

};

exports.deleteProduct = async (req, res) => {

  const { id } = req.params;
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Guard: prevent deletion if product has been sold
    const soldCheck = await client.query(
      "SELECT 1 FROM sales_items WHERE product_id = $1 LIMIT 1",
      [id]
    );

    if (soldCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Cannot delete a product that has existing sales records. Consider deactivating it instead."
      });
    }

    // Safe to delete — no sales history exists
    await client.query("DELETE FROM inventory WHERE product_id = $1", [id]);
    await client.query("DELETE FROM products WHERE product_id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Product deleted successfully" });

  } catch (error) {

    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: error.message || "Error deleting product" });

  } finally {

    client.release();

  }

};