
const axios = require("axios");

const PAYPAL_BASE_URL = (
  process.env.PAYPAL_BASE_URL ||
  "https://api-m.sandbox.paypal.com"
).replace(/\/$/, "");

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal Sandbox credentials are not configured.");
  }

  return { clientId, clientSecret };
}

async function getAccessToken() {
  const { clientId, clientSecret } = getCredentials();

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: clientId, password: clientSecret },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    }
  );

  if (!response.data?.access_token) {
    throw new Error("PayPal did not return an access token.");
  }

  return response.data.access_token;
}

async function createOrder({ amountUSD, currency = "USD", dbOrderId, returnUrl, cancelUrl }) {
  const token = await getAccessToken();

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: String(dbOrderId),
          custom_id: String(dbOrderId),
          amount: {
            currency_code: "USD",
            value: Number(amountUSD).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "AgentRelay",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      timeout: 20000,
    }
  );

  const approvalUrl = response.data?.links?.find(
    (link) => link.rel === "approve" || link.rel === "payer-action"
  )?.href;

  if (response.data?.status !== "CREATED" || !response.data?.id || !approvalUrl) {
    throw new Error("PayPal did not return a valid approval URL.");
  }

  return {
    id: response.data.id,
    status: response.data.status,
    approvalUrl,
  };
}

async function captureOrder(paypalOrderId) {
  if (!paypalOrderId) {
    throw new Error("PayPal order ID is required.");
  }

  const token = await getAccessToken();

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      timeout: 20000,
    }
  );

  return response.data;
}

module.exports = {
  createOrder,
  captureOrder,
};
