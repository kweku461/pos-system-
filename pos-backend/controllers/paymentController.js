const pool = require("../config/db");
const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments
// Cash → completes immediately, no Paystack verification needed
// Card / MoMo → requires a verified Paystack reference
// ─────────────────────────────────────────────────────────────────────────────
exports.createPayment = async (req, res) => {

  const { sale_id, payments, grand_total } = req.body;
  const client = await pool.connect();

  try {

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "Payments must be a non-empty array" });
    }

    await client.query("BEGIN");

    const saleResult = await client.query(
      "SELECT total_amount, status FROM sales WHERE sale_id = $1",
      [sale_id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const sale = saleResult.rows[0];

    if (sale.status === "completed") {
      return res.status(400).json({ message: "This sale has already been paid" });
    }

    if (sale.status === "voided") {
      return res.status(400).json({ message: "Cannot process payment for a voided sale" });
    }

    const existingPayments = await client.query(
      "SELECT payment_id FROM payments WHERE sale_id = $1",
      [sale_id]
    );

    if (existingPayments.rows.length > 0) {
      return res.status(400).json({ message: "Payments already exist for this sale" });
    }

    // ✅ FIX: Use grand_total from frontend (includes tax + discount)
    // instead of sale.total_amount (raw product prices only).
    // If grand_total not provided, fall back to sale.total_amount.
    const expectedTotal = grand_total
      ? parseFloat(grand_total)
      : parseFloat(sale.total_amount);

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    console.log("💰 Payment check:", {
      expectedTotal,
      totalPaid,
      diff: Math.abs(totalPaid - expectedTotal),
      sale_total_amount: sale.total_amount,
      grand_total_from_frontend: grand_total,
    });

    if (Math.abs(totalPaid - expectedTotal) > 0.01) {
      return res.status(400).json({
        message: `Payment amount mismatch. Expected ₵${expectedTotal.toFixed(2)}, received ₵${totalPaid.toFixed(2)}`,
        expectedTotal,
        totalPaid,
      });
    }

    for (const p of payments) {

      if (!p.method || !p.amount) {
        throw new Error("Payment method and amount are required");
      }

      if (parseFloat(p.amount) <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }

      const method = p.method.toLowerCase();

      // ✅ Card and MoMo must have a verified Paystack reference
      if (method === "card" || method === "mobile_money") {

        if (!p.reference) {
          throw new Error(`A Paystack reference is required for ${p.method} payments`);
        }

        const verified = await verifyPaystackTransaction(p.reference, sale_id);

        if (!verified.success) {
          throw new Error(`Paystack verification failed: ${verified.message}`);
        }

        // ✅ Verify Paystack amount matches what we expect (Paystack stores in pesewas)
        const verifiedCedis = verified.amount / 100;
        if (Math.abs(verifiedCedis - parseFloat(p.amount)) > 0.01) {
          throw new Error(
            `Paystack amount mismatch. Expected ₵${parseFloat(p.amount).toFixed(2)}, Paystack recorded ₵${verifiedCedis.toFixed(2)}`
          );
        }

      }

      await client.query(
        `INSERT INTO payments (sale_id, payment_method, amount, transaction_reference)
         VALUES ($1, $2, $3, $4)`,
        [sale_id, p.method, p.amount, p.reference || null]
      );

    }

    // ✅ Update sale: mark completed AND save the actual grand total paid
    await client.query(
      `UPDATE sales
       SET status = 'completed', total_amount = $1
       WHERE sale_id = $2`,
      [expectedTotal, sale_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Payment successful",
      status: "completed",
    });

  } catch (error) {

    await client.query("ROLLBACK");
    console.error("🔴 createPayment error:", error.message);
    res.status(500).json({ message: error.message || "Payment error" });

  } finally {

    client.release();

  }

};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify-paystack
// Called by the frontend after Paystack popup closes successfully.
// Verifies the reference with Paystack and returns the confirmed reference.
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyPaystack = async (req, res) => {

  const { reference, sale_id } = req.body;

  if (!reference) {
    return res.status(400).json({ message: "Transaction reference is required" });
  }

  try {

    const verified = await verifyPaystackTransaction(reference, sale_id);

    if (!verified.success) {
      return res.status(400).json({
        message: verified.message || "Transaction was not successful",
        status: verified.gatewayStatus,
      });
    }

    res.json({
      message: "Transaction verified",
      reference: verified.reference,
      amount: verified.amount / 100, // pesewas → cedis
      channel: verified.channel,
      status: "success",
    });

  } catch (error) {

    console.error("🔴 verifyPaystack error:", error.message);
    res.status(500).json({ message: error.message || "Verification failed" });

  }

};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper — calls Paystack verify API
// ─────────────────────────────────────────────────────────────────────────────
async function verifyPaystackTransaction(reference, saleId) {

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    }
  );

  const { data } = response.data;

  // ✅ Check transaction was successful
  if (data.status !== "success") {
    return {
      success: false,
      message: `Transaction status is "${data.status}", not "success"`,
      gatewayStatus: data.status,
    };
  }

  // ✅ Verify the reference belongs to this sale via metadata (if set)
  if (data.metadata?.sale_id && data.metadata.sale_id != saleId) {
    return {
      success: false,
      message: "Transaction reference does not match this sale",
    };
  }

  return {
    success: true,
    amount: data.amount,       // in pesewas
    reference: data.reference,
    channel: data.channel,
  };

}