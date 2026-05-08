const pool = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get date range based on range param
// ─────────────────────────────────────────────────────────────────────────────
function getDateRange(range) {
  const now = new Date();
  let from;

  if (range === "weekly") {
    from = new Date(now);
    from.setDate(now.getDate() - 6); // last 7 days
  } else if (range === "yearly") {
    from = new Date(now.getFullYear(), 0, 1); // Jan 1 this year
  } else {
    // monthly (default)
    from = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of this month
  }

  return from.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/summary?range=weekly|monthly|yearly
// KPI cards: total revenue, total sales, avg order value, total customers
// ─────────────────────────────────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  const range = req.query.range || "monthly";
  const from = getDateRange(range);

  try {
    // Revenue & sales count from completed sales
    const salesResult = await pool.query(
      `SELECT
         COUNT(*)                            AS total_sales,
         COALESCE(SUM(total_amount), 0)      AS total_revenue,
         COALESCE(AVG(total_amount), 0)      AS avg_order_value
       FROM public.sales
       WHERE status = 'completed'
         AND created_at >= $1`,
      [from]
    );

    // Total active customers
    const customerResult = await pool.query(
      `SELECT COUNT(*) AS total_customers FROM public.customers`
    );

    // Voided sales count in range
    const voidedResult = await pool.query(
      `SELECT COUNT(*) AS voided_sales
       FROM public.sales
       WHERE status = 'voided'
         AND created_at >= $1`,
      [from]
    );

    // Top customer by loyalty points
    const topCustomerResult = await pool.query(
      `SELECT name, loyalty_points
       FROM public.customers
       ORDER BY loyalty_points DESC
       LIMIT 1`
    );

    const s = salesResult.rows[0];

    res.json({
      total_sales: parseInt(s.total_sales),
      total_revenue: parseFloat(s.total_revenue).toFixed(2),
      avg_order_value: parseFloat(s.avg_order_value).toFixed(2),
      total_customers: parseInt(customerResult.rows[0].total_customers),
      voided_sales: parseInt(voidedResult.rows[0].voided_sales),
      top_customer: topCustomerResult.rows[0] || null,
    });

  } catch (error) {
    console.error("getSummary error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching summary" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/chart?range=weekly|monthly|yearly
// Revenue chart data grouped by day (weekly), month (yearly), or day (monthly)
// ─────────────────────────────────────────────────────────────────────────────
exports.getChartData = async (req, res) => {
  const range = req.query.range || "monthly";
  const from = getDateRange(range);

  try {
    let query;

    if (range === "weekly") {
      // Group by day of week for last 7 days
      query = `
        SELECT
          TO_CHAR(created_at, 'Dy') AS label,
          TO_CHAR(created_at, 'YYYY-MM-DD') AS date_key,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COUNT(*) AS sales_count
        FROM public.sales
        WHERE status = 'completed'
          AND created_at >= $1
        GROUP BY label, date_key
        ORDER BY date_key ASC
      `;
    } else if (range === "yearly") {
      // Group by month for the whole year
      query = `
        SELECT
          TO_CHAR(created_at, 'Mon') AS label,
          TO_CHAR(created_at, 'YYYY-MM') AS date_key,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COUNT(*) AS sales_count
        FROM public.sales
        WHERE status = 'completed'
          AND created_at >= $1
        GROUP BY label, date_key
        ORDER BY date_key ASC
      `;
    } else {
      // monthly: group by day of month
      query = `
        SELECT
          TO_CHAR(created_at, 'DD Mon') AS label,
          TO_CHAR(created_at, 'YYYY-MM-DD') AS date_key,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COUNT(*) AS sales_count
        FROM public.sales
        WHERE status = 'completed'
          AND created_at >= $1
        GROUP BY label, date_key
        ORDER BY date_key ASC
      `;
    }

    const result = await pool.query(query, [from]);

    const chartData = result.rows.map((row) => ({
      label: row.label,
      revenue: parseFloat(row.revenue),
      sales: parseInt(row.sales_count),
    }));

    res.json(chartData);

  } catch (error) {
    console.error("getChartData error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching chart data" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/top-products
// Top 5 products by units sold from sales_items
// ─────────────────────────────────────────────────────────────────────────────
exports.getTopProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.product_name                    AS name,
         SUM(si.quantity)                  AS units_sold,
         SUM(si.quantity * si.price)       AS revenue
       FROM public.sales_items si
       JOIN public.products p ON si.product_id = p.product_id
       JOIN public.sales s ON si.sale_id = s.sale_id
       WHERE s.status = 'completed'
       GROUP BY p.product_id, p.product_name
       ORDER BY units_sold DESC
       LIMIT 5`
    );

    const maxSales = result.rows.length > 0
      ? parseInt(result.rows[0].units_sold)
      : 1;

    const topProducts = result.rows.map((row, i) => ({
      rank: i + 1,
      name: row.name,
      units_sold: parseInt(row.units_sold),
      revenue: parseFloat(row.revenue).toFixed(2),
      pct: Math.round((parseInt(row.units_sold) / maxSales) * 100),
    }));

    res.json(topProducts);

  } catch (error) {
    console.error("getTopProducts error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching top products" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/payment-methods
// Breakdown of payment methods from payments table
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentMethods = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         payment_method              AS method,
         COUNT(*)                    AS count,
         COALESCE(SUM(amount), 0)    AS total
       FROM public.payments
       GROUP BY payment_method
       ORDER BY total DESC`
    );

    const data = result.rows.map((row) => ({
      name: row.method,
      count: parseInt(row.count),
      value: parseFloat(row.total),
    }));

    res.json(data);

  } catch (error) {
    console.error("getPaymentMethods error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching payment methods" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/low-stock
// Products with quantity <= 5 (low stock threshold)
// ─────────────────────────────────────────────────────────────────────────────
exports.getLowStock = async (req, res) => {
  const threshold = 5;

  try {
    const result = await pool.query(
      `SELECT
         p.product_name  AS name,
         p.category,
         i.quantity,
         i.last_updated
       FROM public.inventory i
       JOIN public.products p ON i.product_id = p.product_id
       WHERE i.quantity <= $1
       ORDER BY i.quantity ASC`,
      [threshold]
    );

    res.json({
      threshold,
      count: result.rows.length,
      items: result.rows,
    });

  } catch (error) {
    console.error("getLowStock error:", error.message);
    res.status(500).json({ message: error.message || "Error fetching low stock" });
  }
};