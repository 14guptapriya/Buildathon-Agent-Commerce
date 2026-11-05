const Policy = require("../models/Policy");

/**
 * Deterministic Policy Enforcement Engine
 * AI agents MUST pass through this function before performing any monetary/checkout action.
 */
class PolicyService {
  /**
   * Get current merchant policy rules
   */
  static async getPolicy(merchantId = "default_merchant") {
    let policy = await Policy.findOne({ merchantId });
    if (!policy) {
      policy = await Policy.create({ merchantId });
    }
    return policy;
  }

  /**
   * Evaluate whether a purchase total requires human approval or violates daily limits.
   * @param {number} amount - Total amount in INR
   * @param {number} discountPercent - Discount percentage requested by AI
   * @param {string} merchantId
   */
  static async evaluatePurchase(
  amount,
  discountPercent = 0,
  merchantId = "default_merchant",
  buyerAutoLimit = null
) {
    const policy = await this.getPolicy(merchantId);
    const approvalLimit =
  buyerAutoLimit !== null
    ? Number(buyerAutoLimit)
    : policy.autonomousPurchaseLimit;

    const result = {
      allowed: true,
      requiresApproval: false,
      amount,
      autonomousPurchaseLimit: approvalLimit,
      dailySpendingLimit: policy.dailySpendingLimit,
      currentDailySpend: policy.currentDailySpend,
      maxDiscountPercent: policy.maxDiscountPercent,
      violations: [],
      reasons: [],
    };

    // 1. Discount percentage check
    if (discountPercent > policy.maxDiscountPercent) {
      result.allowed = false;
      result.violations.push("DISCOUNT_EXCEEDED");
      result.reasons.push(
        `Requested discount (${discountPercent}%) exceeds maximum allowed AI discount policy (${policy.maxDiscountPercent}%).`
      );
    }

    // 2. Daily spending limit check
    if (policy.currentDailySpend + amount > policy.dailySpendingLimit) {
      result.allowed = false;
      result.violations.push("DAILY_SPEND_EXCEEDED");
      result.reasons.push(
        `Purchase amount (₹${amount.toLocaleString()}) would cause daily spend to exceed daily AI budget cap (₹${policy.dailySpendingLimit.toLocaleString()}).`
      );
    }

    // 3. Autonomous purchase limit check (Triggers human approval)
    
if (amount > approvalLimit) {
  result.requiresApproval = true;
  result.reasons.push(
    `Total amount (₹${amount.toLocaleString()}) exceeds the buyer's autonomous spending limit of ₹${approvalLimit.toLocaleString()}. Customer approval required.`
  );
} else {
  result.reasons.push(
    `Total amount (₹${amount.toLocaleString()}) is within the buyer's autonomous spending limit of ₹${approvalLimit.toLocaleString()}.`
  );
}

    return result;
  }
}

module.exports = PolicyService;
