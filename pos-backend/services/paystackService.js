const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const paystackApi = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

exports.initializePayment = async ({ email, amount, sale_id, metadata }) => {
  const amountInKobo = Math.round(amount * 100);

  const response = await paystackApi.post("/transaction/initialize", {
    email,
    amount: amountInKobo,
    reference: `SALE_${sale_id}_${Date.now()}`,
    metadata: {
      sale_id,
      ...metadata,
    },
  });

  return response.data;
};

exports.verifyPayment = async (reference) => {
  const response = await paystackApi.get(`/transaction/verify/${reference}`);
  return response.data;
};

exports.getTransaction = async (idOrReference) => {
  const response = await paystackApi.get(`/transaction/${idOrReference}`);
  return response.data;
};

exports.listTransactions = async (params = {}) => {
  const response = await paystackApi.get("/transaction", { params });
  return response.data;
};

exports.chargeCard = async ({ email, amount, card, authorization_code }) => {
  const amountInKobo = Math.round(amount * 100);

  const response = await paystackApi.post("/transaction/charge_authorization", {
    email,
    amount: amountInKobo,
    authorization_code,
    card,
  });

  return response.data;
};