
const Customer = require("../models/Customer");

// Get customer profile by sessionId
exports.getProfile = async (req, res) => {
  try {
    const { sessionId } = req.params;

    let customer = await Customer.findOne({ sessionId });

    if (!customer) {
      customer = await Customer.create({ sessionId });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer profile",
      error: error.message,
    });
  }
};

// Update buyer profile and spending preferences
exports.updateProfile = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const {
      name,
      email,
      phone,
      autonomousSpendingLimit,
    } = req.body;

    let customer = await Customer.findOne({ sessionId });

    if (!customer) {
      customer = new Customer({ sessionId });
    }

    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (phone !== undefined) customer.phone = phone;

    if (autonomousSpendingLimit !== undefined) {
      const limit = Number(autonomousSpendingLimit);

      if (!Number.isFinite(limit) || limit < 0) {
        return res.status(400).json({
          success: false,
          message: "Spending limit must be a valid non-negative number.",
        });
      }

      customer.autonomousSpendingLimit = limit;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer profile updated successfully",
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update customer profile",
      error: error.message,
    });
  }
};
exports.debugProfile = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const customer = await Customer.findOne({ sessionId });

    return res.json({
      requestedSessionId: sessionId,
      customerFound: !!customer,
      databaseSessionId: customer?.sessionId,
      autonomousSpendingLimit: customer?.autonomousSpendingLimit,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};