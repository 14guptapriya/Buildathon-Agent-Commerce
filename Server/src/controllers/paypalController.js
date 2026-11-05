
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

const PolicyService = require("../services/policyService");
const PayPalService = require("../services/paypalService");
const OrderCompletionService = require("../services/orderCompletionService");

function getUsdRate() {
  const rate = Number(process.env.INR_TO_USD_RATE);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("INR_TO_USD_RATE must be a positive number.");
  }

  return rate;
}

function toUSD(amountINR) {
  return Number((amountINR * getUsdRate()).toFixed(2));
}

// 1. Create PayPal Order
exports.createOrder = async (req, res) => {
  let dbOrder;

  try {
    const { sessionId, cartId, isApproved = false } = req.body;

    if (!sessionId || !cartId) {
      return res.status(400).json({
        success: false,
        message: "sessionId and cartId are required.",
      });
    }

    if (!mongoose.isValidObjectId(cartId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart ID.",
      });
    }

    const cart = await Cart.findOne({
      _id: cartId,
      sessionId,
      status: "active",
    }).populate("items.product");

    if (!cart || !cart.items.length) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found or empty.",
      });
    }

    // Always use current database product prices.
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return res.status(400).json({
          success: false,
          message: "A product in this cart is unavailable.",
        });
      }

      item.price = item.product.price;
    }

    cart.recalculateTotals();

    const amountINR = Number(cart.total.toFixed(2));

    const policyResult = await PolicyService.evaluatePurchase(amountINR);

    if (!policyResult.allowed) {
      return res.status(403).json({
        success: false,
        message: "Purchase blocked by merchant policy.",
        policyEvaluation: policyResult,
      });
    }

    if (policyResult.requiresApproval && !isApproved) {
      return res.status(403).json({
        success: false,
        requiresApproval: true,
        message: "Human approval is required before payment.",
        policyEvaluation: policyResult,
      });
    }

    const amountUSD = toUSD(amountINR);

    if (amountUSD <= 0) {
      return res.status(400).json({
        success: false,
        message: "Converted USD amount must be greater than zero.",
      });
    }

    const subtotalUSD = toUSD(cart.subtotal);

    const discountUSD = Number(
      Math.max(0, subtotalUSD - amountUSD).toFixed(2)
    );

    dbOrder = await Order.create({
      orderNumber: `ORD-${Date.now()}-${Math.floor(
        1000 + Math.random() * 1000
      )}`,

      sessionId,
      cartId: cart._id,

      items: cart.items.map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: toUSD(item.price),
        quantity: item.quantity,
        sku: item.product.sku,
      })),

      subtotal: subtotalUSD,
      discountAmount: discountUSD,
      totalAmount: amountUSD,

      currency: "USD",
      sourceCurrency: "INR",
      sourceTotalAmountINR: amountINR,

      status: "pending_payment",
      fulfillmentStatus: "pending",

      requiresApproval: Boolean(policyResult.requiresApproval),
      isApproved: Boolean(isApproved),

      approvalDetails: isApproved
        ? {
            approvedAt: new Date(),
            approvedBy: "buyer",
            channel: "paypal_checkout",
            reason: "Buyer explicitly approved PayPal checkout",
          }
        : undefined,

      paymentProvider: "paypal",
      paymentStatus: "created",
    });

    const frontendUrl = (
      process.env.CLIENT_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const paypalOrder = await PayPalService.createOrder({
      amountUSD,
      dbOrderId: dbOrder._id.toString(),
      returnUrl: `${frontendUrl}/?paypal=return&dbOrderId=${dbOrder._id}`,
      cancelUrl: `${frontendUrl}/?paypal=cancel&dbOrderId=${dbOrder._id}`,
    });

    dbOrder.paypalOrderId = paypalOrder.id;
    await dbOrder.save();

    return res.status(201).json({
      success: true,
      order: dbOrder,
      paypalOrder,
      approvalUrl: paypalOrder.approvalUrl,
      currency: "USD",
      amountUSD,
      sourceTotalAmountINR: amountINR,
    });
  } catch (error) {
    console.error(
      "PayPal create-order error:",
      error.response?.data || error.message
    );

    if (dbOrder) {
      dbOrder.status = "failed";
      dbOrder.paymentStatus = "failed";
      await dbOrder.save().catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to create PayPal order.",
    });
  }
};

// 2. Capture and Verify PayPal Payment
exports.captureOrder = async (req, res) => {
  try {
    const { dbOrderId, paypalOrderId } = req.body;

    if (!mongoose.isValidObjectId(dbOrderId) || !paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "Valid dbOrderId and paypalOrderId are required.",
      });
    }

    const order = await Order.findById(dbOrderId);

    if (!order || order.paymentProvider !== "paypal") {
      return res.status(404).json({
        success: false,
        message: "PayPal order not found.",
      });
    }

    if (order.paypalOrderId !== paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID does not match this database order.",
      });
    }

    // Recover fulfillment if payment was captured previously.
    if (order.status === "paid" && order.paypalCaptureId) {
      const result = await OrderCompletionService.completeOrder({
        orderId: dbOrderId,
        provider: "paypal",
        paymentId: order.paypalCaptureId,
      });

      return res.json({
        success: true,
        message: "Previously captured payment checked and order processed.",
        order: result.order,
        alreadyCompleted: result.alreadyCompleted,
      });
    }

    if (order.status !== "pending_payment") {
      return res.status(409).json({
        success: false,
        message: "This order is not awaiting payment.",
      });
    }

    // Capture payment through PayPal.
    const captureResult = await PayPalService.captureOrder(paypalOrderId);

    const purchaseUnit = captureResult.purchase_units?.find(
      (unit) => unit.custom_id === String(order._id)
    );

    const capture = purchaseUnit?.payments?.captures?.[0];

    const expectedAmount = Number(order.totalAmount).toFixed(2);

    // Verify the actual captured payment.
    if (
      captureResult.status !== "COMPLETED" ||
      capture?.status !== "COMPLETED" ||
      capture?.amount?.currency_code !== "USD" ||
      Number(capture?.amount?.value).toFixed(2) !== expectedAmount ||
      !capture?.id
    ) {
      return res.status(409).json({
        success: false,
        message:
          "PayPal capture was not completed or did not match the expected order amount.",
      });
    }

    // Shared fulfillment for BOTH PayPal and Razorpay.
    const result = await OrderCompletionService.completeOrder({
      orderId: dbOrderId,
      provider: "paypal",
      paymentId: capture.id,
    });

    return res.json({
      success: true,
      message: "PayPal payment captured, verified, and order processed.",
      order: result.order,
      alreadyCompleted: result.alreadyCompleted,
    });
  } catch (error) {
    console.error(
      "PayPal capture error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to capture or process PayPal payment.",
    });
  }
};
