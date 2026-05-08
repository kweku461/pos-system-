const pool = require("../config/db");

exports.createSale = async (req, res) => {

  const { items, customer_id, payment_method } = req.body;
  const userId = req.user.user_id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Invalid or empty items array" });
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const productIds = items.map(i => i.product_id);

    if (productIds.length === 0) {
      throw new Error("Invalid item: product_id and quantity are required");
    }

    // Fetch all products in one query
    const products = await client.query(
      "SELECT product_id, price FROM products WHERE product_id = ANY($1)",
      [productIds]
    );

    if (products.rows.length !== productIds.length) {
      const foundIds = products.rows.map(p => p.product_id);
      const missing = productIds.filter(id => !foundIds.includes(id));
      throw new Error(`Products not found: ${missing.join(", ")}`);
    }

    const productMap = {};
    for (const p of products.rows) {
      productMap[p.product_id] = parseFloat(p.price);
    }

    // Fetch all inventory in one query
    const productInventory = await client.query(
      "SELECT product_id, quantity FROM inventory WHERE product_id = ANY($1)",
      [productIds]
    );

    const inventoryMap = {};
    for (const inv of productInventory.rows) {
      inventoryMap[inv.product_id] = inv.quantity;
    }

    if (productInventory.rows.length !== productIds.length) {
      const foundIds = productInventory.rows.map(i => i.product_id);
      const missing = productIds.filter(id => !foundIds.includes(id));
      throw new Error(`Inventory records not found for products: ${missing.join(", ")}`);
    }

    let totalAmount = 0;
    const saleItems = [];

    for (const item of items) {
      const price = productMap[item.product_id];
      const available = inventoryMap[item.product_id];

      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.product_id}. Available: ${available}, requested: ${item.quantity}`
        );
      }

      totalAmount += price * item.quantity;
      saleItems.push({ ...item, price });
    }

    // Sale always starts as "pending" — paymentController completes it
    const sale = await client.query(
      `INSERT INTO sales (user_id, total_amount, customer_id, status, payment_method)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING *`,
      [userId, totalAmount, customer_id || null, payment_method || null]
    );

    const saleId = sale.rows[0].sale_id;

    // Add loyalty points immediately on sale creation
    if (customer_id) {
      const points = Math.floor(totalAmount / 10);
      await client.query(
        `UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE customer_id = $2`,
        [points, customer_id]
      );
    }

    for (const item of saleItems) {
      await client.query(
        `INSERT INTO sales_items (sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [saleId, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sale created",
      sale_id: saleId,
      total: totalAmount,
      status: "pending",
      payment_method: payment_method || null
    });

  } catch (error) {

    await client.query("ROLLBACK");
    console.error("createSale error:", error.message);
    res.status(500).json({ message: error.message || "Error processing sale" });

  } finally {

    client.release();

  }

};

exports.getSales = async (req, res) => {

  try {

    const sales = await pool.query(
      `SELECT sale_id, user_id, total_amount, created_at, status, customer_id
       FROM public.sales ORDER BY created_at DESC`
    );

    res.json(sales.rows);

  } catch (error) {

    console.error("getSales error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching sales" });

  }

};

exports.getSaleById = async (req, res) => {

  const { id } = req.params;

  try {

    const sale = await pool.query(
      "SELECT sale_id, user_id, total_amount, created_at, customer_id, status FROM sales WHERE sale_id = $1",
      [id]
    );

    if (sale.rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const items = await pool.query(
      `SELECT si.*, p.product_name
       FROM sales_items si
       JOIN products p ON si.product_id = p.product_id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({ ...sale.rows[0], items: items.rows });

  } catch (error) {

    console.error("getSaleById error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching sale" });

  }

};

exports.voidSale = async (req, res) => {

  const { id } = req.params;
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const sale = await client.query(
      "SELECT status, customer_id, total_amount FROM sales WHERE sale_id = $1 FOR UPDATE",
      [id]
    );

    if (sale.rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    if (sale.rows[0].status === "voided") {
      return res.status(400).json({ message: "Sale already voided" });
    }

    const items = await client.query(
      "SELECT product_id, quantity FROM sales_items WHERE sale_id = $1",
      [id]
    );

    for (const item of items.rows) {
      await client.query(
        `UPDATE inventory SET quantity = quantity + $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    const result = await client.query(
      `UPDATE sales SET status = 'voided' WHERE sale_id = $1 AND status != 'voided' RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Sale already voided or could not be voided" });
    }

    const { customer_id, total_amount } = sale.rows[0];

    if (customer_id && total_amount) {
      const pointsToReverse = Math.floor(total_amount / 10);
      await client.query(
        `UPDATE customers
         SET loyalty_points = GREATEST(loyalty_points - $1, 0)
         WHERE customer_id = $2`,
        [pointsToReverse, customer_id]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Sale voided successfully" });

  } catch (error) {

    await client.query("ROLLBACK");
    console.error("voidSale error:", error.message);
    res.status(500).json({ message: error.message || "Error voiding sale" });

  } finally {

    client.release();

  }

};