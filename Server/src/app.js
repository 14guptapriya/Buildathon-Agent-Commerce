const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const productRoutes = require("./routes/productRoutes");
const policyRoutes = require("./routes/policyRoutes");
const cartRoutes = require("./routes/cartRoutes");
const auditRoutes = require("./routes/auditRoutes");
const agentRoutes = require("./routes/agentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const paypalRoutes = require("./routes/paypalRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/payment/paypal", paypalRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AgentRelay API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;