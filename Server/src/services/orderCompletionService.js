
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Policy = require("../models/Policy");
const AuditEvent = require("../models/AuditEvent");

// Write audit events inside a transaction when a session is supplied.
// Failure events are written separately after a transaction aborts.
async function createAuditEvent(
  session,
  order,
  action,
  title,
  description,
  details = {},
  status = "SUCCESS"
) {
  const event = {
    eventId: `evt_${new mongoose.Types.ObjectId()}`,
    sessionId: order.sessionId,
    actor: "PAYMENT_SERVICE",
    action,
    status,
    title,
    description,
    details,
  };

  if (session) {
    await AuditEvent.create([event], { session });
  } else {
    await AuditEvent.create(event);
  }
}

class OrderCompletionService {
  static async completeOrder({ orderId, provider, paymentId }) {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new Error("Invalid database order ID.");
    }

    if (!["razorpay", "paypal"].includes(provider)) {
      throw new Error("Unsupported payment provider.");
    }

    if (!paymentId) {
      throw new Error("Verified payment ID is required.");
    }

    // STEP 1: Confirm the database order and payment provider.
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.paymentProvider !== provider) {
      throw new Error("Payment provider does not match the order.");
    }

    const storedPaymentId =
      provider === "razorpay"
        ? order.razorpayPaymentId
        : order.paypalCaptureId;

    // Prevent a different payment ID from being associated with this order.
    if (order.status === "paid" && storedPaymentId &&
        storedPaymentId !== paymentId) {
      throw new Error("Payment ID does not match the verified order payment.");
    }

    if (
      order.status === "paid" &&
      order.fulfillmentStatus === "completed"
    ) {
      return {
        success: true,
        alreadyCompleted: true,
        order,
      };
    }

    if (!["pending_payment", "paid"].includes(order.status)) {
      throw new Error("Order is not eligible for completion.");
    }

    // STEP 2: Persist external payment verification.
    // This must happen outside the transaction because the payment
    // provider may already have captured the money.
    if (order.status !== "paid") {
      order.status = "paid";
    }

    order.paymentStatus = "captured";
    order.paymentVerifiedAt = order.paymentVerifiedAt || new Date();

    if (provider === "razorpay") {
      order.razorpayPaymentId = paymentId;
    } else {
      order.paypalCaptureId = paymentId;
    }

    await order.save();

    // STEP 3: Fulfill atomically.
    const dbSession = await mongoose.startSession();

    let alreadyCompleted = false;

    try {
      await dbSession.withTransaction(async () => {
        // Atomically claim this order for fulfillment.
        // A failed fulfillment can be retried because its previous
        // transaction was rolled back.
        const currentOrder = await Order.findOneAndUpdate(
          {
            _id: orderId,
            status: "paid",
            fulfillmentStatus: { $in: ["pending", "failed"] },
          },
          {
            $set: {
              fulfillmentStatus: "processing",
              fulfillmentError: "",
            },
          },
          {
            new: true,
            session: dbSession,
          }
        );

        if (!currentOrder) {
          const latestOrder = await Order.findById(orderId)
            .session(dbSession);

          if (
            latestOrder &&
            latestOrder.status === "paid" &&
            latestOrder.fulfillmentStatus === "completed"
          ) {
            alreadyCompleted = true;
            return;
          }

          if (
            latestOrder &&
            latestOrder.fulfillmentStatus === "processing"
          ) {
            throw new Error("Order fulfillment is already in progress.");
          }

          throw new Error("Unable to claim order for fulfillment.");
        }

        // Aggregate product quantities.
        const productQuantities = new Map();

        for (const item of currentOrder.items) {
          const productId = String(item.product);
          const quantity = Number(item.quantity);

          if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error(`Invalid quantity for product ${productId}.`);
          }

          productQuantities.set(
            productId,
            (productQuantities.get(productId) || 0) + quantity
          );
        }

        if (productQuantities.size === 0) {
          throw new Error("Order has no products to fulfill.");
        }

        // Deduct stock only when sufficient inventory exists.
        for (const [productId, quantity] of productQuantities) {
          const result = await Product.updateOne(
            {
              _id: productId,
              stock: { $gte: quantity },
              isActive: true,
            },
            {
              $inc: { stock: -quantity },
            },
            { session: dbSession }
          );

          if (result.modifiedCount !== 1) {
            throw new Error(
              `Insufficient stock or unavailable product: ${productId}`
            );
          }
        }

        await createAuditEvent(
          dbSession,
          currentOrder,
          "INVENTORY_UPDATED",
          "Inventory Updated",
          `Inventory deducted for order #${currentOrder.orderNumber}.`,
          {
            orderId: currentOrder._id,
            products: [...productQuantities.entries()].map(
              ([productId, quantity]) => ({ productId, quantity })
            ),
          }
        );

        // Merchant spending is always recorded in INR.
        const amountINR =
          currentOrder.currency === "USD"
            ? Number(currentOrder.sourceTotalAmountINR)
            : Number(currentOrder.totalAmount);

        if (!Number.isFinite(amountINR) || amountINR <= 0) {
          throw new Error("Invalid original INR order amount.");
        }

        const policyResult = await Policy.updateOne(
          { merchantId: "default_merchant" },
          { $inc: { currentDailySpend: amountINR } },
          { session: dbSession }
        );

        if (policyResult.matchedCount !== 1) {
          throw new Error("Merchant policy record not found.");
        }

        // Convert the exact cart associated with this order.
        const cartFilter = currentOrder.cartId
          ? {
              _id: currentOrder.cartId,
              status: "active",
            }
          : {
              sessionId: currentOrder.sessionId,
              status: "active",
            };

        const convertedCart = await Cart.findOneAndUpdate(
          cartFilter,
          { $set: { status: "converted" } },
          {
            new: true,
            session: dbSession,
          }
        );

        if (!convertedCart) {
          throw new Error("The order's active cart could not be found.");
        }

        // Finalize the order.
        currentOrder.fulfillmentStatus = "completed";
        currentOrder.fulfilledAt = new Date();
        currentOrder.fulfillmentError = "";

        await currentOrder.save({ session: dbSession });

        await createAuditEvent(
          dbSession,
          currentOrder,
          "ORDER_FULFILLED",
          "Order Fulfilled Successfully",
          `Order #${currentOrder.orderNumber} was paid and fulfilled.`,
          {
            orderId: currentOrder._id,
            orderNumber: currentOrder.orderNumber,
            provider,
            paymentId,
            amount: currentOrder.totalAmount,
            currency: currentOrder.currency,
            merchantSpendINR: amountINR,
          }
        );
      });

      const completedOrder = await Order.findById(orderId);

      return {
        success: true,
        alreadyCompleted,
        order: completedOrder,
      };
    } catch (error) {
      // Do not mark a successfully captured payment as failed.
      // Only fulfillment is marked failed so it can be investigated/retried.
      await Order.updateOne(
        {
          _id: orderId,
          fulfillmentStatus: { $ne: "completed" },
        },
        {
          $set: {
            fulfillmentStatus: "failed",
            fulfillmentError: error.message,
          },
        }
      );

      await createAuditEvent(
        null,
        order,
        "FULFILLMENT_FAILED",
        "Order Fulfillment Failed",
        error.message,
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          provider,
          paymentId,
        },
        "FAILED"
      ).catch((auditError) => {
        console.error(
          "Fulfillment failure audit error:",
          auditError.message
        );
      });

      throw error;
    } finally {
      await dbSession.endSession();
    }
  }
}

module.exports = OrderCompletionService;
