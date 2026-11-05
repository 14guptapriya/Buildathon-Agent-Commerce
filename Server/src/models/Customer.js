
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      default: "Alex Vance",
    },

    email: {
      type: String,
      default: "alex@agentrelay.ai",
    },

    phone: {
      type: String,
      default: "+91 9876543210",
    },

    // Buyer-defined spending governance.
    // This is independent of the payment provider.
    autonomousSpendingLimit: {
      type: Number,
      default: 10000,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
