
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Customer = require("../models/Customer");
const AuditEvent = require("../models/AuditEvent");
const PolicyService = require("./policyService");
const BuyerAgentService = require("./buyerAgentService");

// Safely record agent activity
async function createAuditEvent(
  sessionId,
  actor,
  action,
  title,
  description,
  details = {},
  status = "SUCCESS"
) {
  try {
    const eventId = `evt_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    await AuditEvent.create({
      eventId,
      sessionId,
      actor,
      action,
      status,
      title,
      description,
      details,
    });
  } catch (err) {
    console.error("Failed to write audit event:", err.message);
  }
}

function tokenize(value = "") {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
}

function getProductSearchText(product) {
  const specs = Object.values(product.specs?.toObject?.() || product.specs || {})
    .filter((value) => typeof value === "string")
    .join(" ");

  return [
    product.title,
    product.description,
    product.brand,
    product.category,
    ...(product.features || []),
    ...(product.tags || []),
    ...(product.useCases || []),
    specs,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

class AgentService {
  /**
   * Main A2A shopping workflow:
   * 1. Buyer sends request.
   * 2. Buyer Agent understands request using Groq.
   * 3. Merchant Agent searches catalog and checks inventory.
   * 4. Merchant Agent sends product proposal.
   * 5. Buyer Agent evaluates buyer spending policies.
   * 6. Cart is prepared for checkout.
   *
   * Payment is handled separately through PayPal checkout.
   */
  static async processShoppingRequest(sessionId, userPrompt, options = {}) {
    const startTime = Date.now();
    const a2aProtocolSteps = [];

    // Retrieve an existing customer profile if available.
    // Do not create a fake saved card or payment vault.
    const customer = await Customer.findOne({ sessionId });
   

const buyerAutoLimit =
  customer?.autonomousSpendingLimit !== undefined &&
  customer?.autonomousSpendingLimit !== null
    ? Number(customer.autonomousSpendingLimit)
    : 10000;
console.log("BUYER AUTO LIMIT USED:", buyerAutoLimit);
    // STEP 1: Buyer -> Buyer Agent
    const intentAnalysis =
      await BuyerAgentService.understandRequest(userPrompt);

    a2aProtocolSteps.push({
      stepNumber: 1,
      sender: "BUYER_HUMAN",
      receiver: "BUYER_AGENT",
      title: "1. Buyer → Buyer Agent Prompt Dispatch",
      message: `"${userPrompt}"`,
      detail: `Groq understood the request: ${intentAnalysis.summary}`,
    });

    await createAuditEvent(
      sessionId,
      "BUYER_AGENT",
      "INTENT_RECEIVED",
      "Step 1: Buyer Prompt Received",
      `Buyer Agent received: "${userPrompt}"`,
      { intentAnalysis, buyerAutoLimit }
    );

    if (!intentAnalysis.is_shopping_request) {
      return {
        success: true,
        sessionId,
        status: "NOT_A_SHOPPING_REQUEST",
        message: "Please describe a product you want to purchase.",
        intentSummary: intentAnalysis.summary,
        a2aProtocolSteps,
      };
    }

    if (intentAnalysis.needs_clarification) {
      return {
        success: true,
        sessionId,
        status: "NEEDS_CLARIFICATION",
        message:
          intentAnalysis.clarification_question ||
          "Could you provide more details about the product?",
        intentSummary: intentAnalysis.summary,
        a2aProtocolSteps,
      };
    }

    // STEP 2: Buyer Agent -> Merchant Agent
    const budgetText =
      intentAnalysis.max_budget !== null
        ? `₹${intentAnalysis.max_budget.toLocaleString("en-IN")}`
        : "No specified budget";

    a2aProtocolSteps.push({
      stepNumber: 2,
      sender: "BUYER_AGENT",
      receiver: "MERCHANT_AGENT",
      title: "2. Buyer Agent → Merchant Agent Query",
      message: `Find ${intentAnalysis.product_type} matching the buyer's requirements.`,
      detail: `Category: ${intentAnalysis.category}. Budget: ${budgetText}.`,
    });

    await createAuditEvent(
      sessionId,
      "BUYER_AGENT",
      "INTER_AGENT_QUERY",
      "Step 2: Merchant Agent Query",
      "Buyer Agent transmitted structured product requirements.",
      { intentAnalysis }
    );

    // STEP 3: Merchant Agent searches catalog
    const searchResults =
      await this.searchProductsForIntent(intentAnalysis);

    const primaryProduct = searchResults.primaryRecommendation;
    const crossSellProduct = searchResults.crossSellRecommendation;

    if (!primaryProduct) {
      return {
        success: false,
        sessionId,
        status: "NO_MATCH_FOUND",
        message:
          "No in-stock products were found within your specified budget and requirements.",
        intentSummary: intentAnalysis.summary,
        matchedProducts: [],
        a2aProtocolSteps,
      };
    }

    const merchantSellPolicyPassed =
      primaryProduct.isActive && primaryProduct.stock > 0;

    a2aProtocolSteps.push({
      stepNumber: 3,
      sender: "MERCHANT_AGENT",
      receiver: "INTERNAL_MERCHANT_POLICY",
      title: "3. Merchant Agent Catalog & Inventory Check",
      message: `Evaluating ${primaryProduct.title}.`,
      detail: `Stock: ${primaryProduct.stock}. Merchant policy: ${
        merchantSellPolicyPassed ? "PASSED" : "FAILED"
      }.`,
    });

    await createAuditEvent(
      sessionId,
      "MERCHANT_AGENT",
      "MERCHANT_POLICY_EVALUATED",
      "Step 3: Merchant Inventory Validation",
      `Evaluated ${primaryProduct.title}.`,
      {
        productId: primaryProduct._id,
        title: primaryProduct.title,
        stock: primaryProduct.stock,
        merchantSellPolicyPassed,
      },
      merchantSellPolicyPassed ? "SUCCESS" : "FAILED"
    );

    if (!merchantSellPolicyPassed) {
      return {
        success: false,
        sessionId,
        status: "OUT_OF_STOCK",
        message: "The recommended product is no longer available.",
        a2aProtocolSteps,
      };
    }

    // STEP 4: Merchant Agent sends proposal to Buyer Agent
    const proposalSubtotal =
      primaryProduct.price + (crossSellProduct?.price || 0);

    const proposalPitch = searchResults.recommendationReason;

    a2aProtocolSteps.push({
      stepNumber: 4,
      sender: "MERCHANT_AGENT",
      receiver: "BUYER_AGENT",
      title: "4. Merchant Agent → Buyer Agent Proposal",
      message: `Primary: ${primaryProduct.title} (₹${primaryProduct.price.toLocaleString(
        "en-IN"
      )}). ${
        crossSellProduct
          ? `Accessory: ${crossSellProduct.title} (₹${crossSellProduct.price.toLocaleString(
              "en-IN"
            )}).`
          : "No additional accessory selected."
      } Total: ₹${proposalSubtotal.toLocaleString("en-IN")}.`,
      detail: proposalPitch,
    });

    await createAuditEvent(
      sessionId,
      "MERCHANT_AGENT",
      "PROPOSAL_DISPATCHED",
      "Step 4: Merchant Proposal",
      `Merchant proposed ${primaryProduct.title}.`,
      {
        primaryProduct: primaryProduct.title,
        primaryPrice: primaryProduct.price,
        crossSell: crossSellProduct?.title || null,
        subtotal: proposalSubtotal,
      }
    );

    // STEP 5: Prepare cart and evaluate buyer policies
    let cart = await Cart.findOne({ sessionId, status: "active" });

    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    cart.items = [
      {
        product: primaryProduct._id,
        title: primaryProduct.title,
        price: primaryProduct.price,
        quantity: 1,
        isCrossSell: false,
        addedByAgent: true,
      },
    ];

    if (crossSellProduct) {
      cart.items.push({
        product: crossSellProduct._id,
        title: crossSellProduct.title,
        price: crossSellProduct.price,
        quantity: 1,
        isCrossSell: true,
        addedByAgent: true,
      });
    }

    cart.recalculateTotals();
    await cart.save();
    await cart.populate("items.product");

    const policyResult = await PolicyService.evaluatePurchase(
  cart.total,
  0,
  "default_merchant",
  buyerAutoLimit
);

const exceedsBuyerAutoLimit = cart.total > buyerAutoLimit;

const requiresHumanApproval =
  policyResult.requiresApproval || exceedsBuyerAutoLimit;



    const policyEvaluation = {
      ...policyResult,
      requiresApproval: requiresHumanApproval,
      reasons: [
        ...(policyResult.reasons || []),
        ...(exceedsBuyerAutoLimit
          ? [
              `Cart total ₹${cart.total.toLocaleString(
                "en-IN"
              )} exceeds buyer spending limit ₹${buyerAutoLimit.toLocaleString(
                "en-IN"
              )}.`,
            ]
          : []),
      ],
    };

    a2aProtocolSteps.push({
      stepNumber: 5,
      sender: "BUYER_AGENT",
      receiver: "POLICY_ENGINE",
      title: "5. Buyer Agent → Private Policy Evaluation",
      message: `Evaluating ₹${cart.total.toLocaleString(
        "en-IN"
      )} against buyer limit ₹${buyerAutoLimit.toLocaleString("en-IN")}.`,
      detail: !policyResult.allowed
        ? "BLOCKED: Purchase does not satisfy policy rules."
        : requiresHumanApproval
        ? "PAUSED: Human approval is required."
        : "PASSED: Proposal satisfies the current policy checks.",
    });

    await createAuditEvent(
      sessionId,
      "POLICY_ENGINE",
      "BUYER_POLICY_EVALUATED",
      "Step 5: Buyer Policy Evaluation",
      policyEvaluation.reasons.join(" ") ||
        "Purchase passed buyer policy checks.",
      {
        cartTotal: cart.total,
        buyerAutoLimit,
        requiresApproval: requiresHumanApproval,
        allowed: policyResult.allowed,
      }
    );

    // No autonomous payment here.
    // The user must proceed through the actual PayPal checkout flow.
    let status = "READY_FOR_PAYMENT";

    if (!policyResult.allowed) {
      status = "POLICY_BLOCKED";
    } else if (requiresHumanApproval) {
      status = "AWAITING_APPROVAL";

      await createAuditEvent(
        sessionId,
        "POLICY_ENGINE",
        "APPROVAL_REQUESTED",
        "Step 6: Buyer Approval Required",
        "The proposal requires buyer authorization before checkout.",
        {
          requestedAmount: cart.total,
          buyerAutoLimit,
        }
      );
    } else {
      a2aProtocolSteps.push({
        stepNumber: 6,
        sender: "BUYER_AGENT",
        receiver: "BUYER_HUMAN",
        title: "6. Buyer Agent → Buyer Checkout Handoff",
        message: "The proposal passed policy checks and is ready for review.",
        detail:
          "The buyer can review the cart and proceed to PayPal checkout. No payment has been made yet.",
      });
    }

    const executionTimeMs = Date.now() - startTime;

    const toolCallsList = [
      {
        name: "1_understand_buyer_intent",
        status: "completed",
        result: intentAnalysis.summary,
      },
      {
        name: "2_query_merchant_agent",
        status: "completed",
        result: `Category: ${intentAnalysis.category}; Budget: ${budgetText}`,
      },
      {
        name: "3_search_and_rank_products",
        status: "completed",
        result: `${searchResults.matchedProducts.length} matching products found`,
      },
      {
        name: "4_evaluate_merchant_inventory",
        status: "completed",
        result: merchantSellPolicyPassed
          ? "Merchant inventory check passed"
          : "Stock unavailable",
      },
      {
        name: "5_receive_merchant_proposal",
        status: "completed",
        result: `${primaryProduct.title} (₹${proposalSubtotal})`,
      },
      {
        name: "6_evaluate_buyer_policy",
        status: "completed",
        result: status,
      },
    ];

    return {
      success: true,
      sessionId,
      intentSummary: intentAnalysis.summary,
      intentAnalysis,
      primaryProduct,
      crossSellProduct,
      matchedProducts: searchResults.matchedProducts,
      recommendationReason: searchResults.recommendationReason,
      customerProfile: {
        
  name: customer?.name || "Buyer",
  autonomousSpendingLimit: buyerAutoLimit,
},
    
      cart: {
        id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
      },
      policyEvaluation,
      status,
      autoPaidOrder: null,
      executionTimeMs,
      toolCalls: toolCallsList,
      a2aProtocolSteps,
    };
  }

  /**
   * Merchant Agent product discovery and ranking.
   */
  static async searchProductsForIntent(intent) {
    const hasBudget =
      intent.budget_specified &&
      Number.isFinite(Number(intent.max_budget));

    const maxBudget = hasBudget
      ? Number(intent.max_budget)
      : null;

    // Category mapping: the AI uses "Audio", while the catalog
    // can store headphones under either Audio or Headphones.
    const categoryMap = {
      Audio: ["Audio", "Headphones"],
      Headphones: ["Audio", "Headphones"],
    };

    const categories =
      categoryMap[intent.category] || [intent.category];

    const query = {
      isActive: true,
      stock: { $gt: 0 },
    };

    if (intent.category && intent.category !== "Other") {
      query.category = { $in: categories };
    }

    if (hasBudget) {
      query.price = { $lte: maxBudget };
    }

    // Never fall back to products above the buyer's budget.
    const candidates = await Product.find(query);

    const requirementWords = tokenize(
      (intent.requirements || []).join(" ")
    );

    const productTypeWords = tokenize(intent.product_type || "");
    const purposeWords = tokenize(intent.purpose || "");

    const scoredCandidates = candidates.map((product) => {
      const searchableText = getProductSearchText(product);

      let score = 0;
      const matchedRequirements = [];

      // Match requested product type.
      for (const word of productTypeWords) {
        if (searchableText.includes(word)) {
          score += 8;
        }
      }

      // Match requirements such as ANC, wireless, battery life.
      for (const word of requirementWords) {
        if (searchableText.includes(word)) {
          score += 10;
          matchedRequirements.push(word);
        }
      }

      // Match the buyer's intended use case.
      for (const word of purposeWords) {
        if (searchableText.includes(word)) {
          score += 7;
        }
      }

      // Category match.
      if (categories.includes(product.category)) {
        score += 12;
      }

      // Product metadata quality.
      score += Math.min(
        Number(product.aiMetadata?.discoverabilityScore || 0) / 20,
        5
      );

      // Rating as a small tie-breaker.
      score += Number(product.rating || 0);

      return {
        product,
        score,
        matchedRequirements,
      };
    });

    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return (
        Number(b.product.rating || 0) -
        Number(a.product.rating || 0)
      );
    });

    const primaryRecommendation =
      scoredCandidates[0]?.product || null;

    // Cross-selling is optional and must fit the remaining budget.
    let crossSellRecommendation = null;

    if (
      primaryRecommendation &&
      intent.cross_sell_allowed === true
    ) {
      const remainingBudget = hasBudget
        ? maxBudget - primaryRecommendation.price
        : 5000;

      if (remainingBudget > 0) {
        const compatibleIds =
          primaryRecommendation.compatibleProducts || [];

        const recommendedNames = (
          primaryRecommendation.aiMetadata
            ?.recommendedCrossSells || []
        ).map((value) => value.toLowerCase());

        const accessoryCandidates = await Product.find({
          _id: { $ne: primaryRecommendation._id },
          isActive: true,
          stock: { $gt: 0 },
          price: { $lte: remainingBudget },
          category: "Accessories",
        });

        const rankedAccessories = accessoryCandidates.map(
          (product) => {
            const productText = getProductSearchText(product);
            let score = 0;

            // Explicit compatibility references have priority.
            if (
              compatibleIds.some(
                (id) => id.toString() === product._id.toString()
              )
            ) {
              score += 100;
            }

            // Match merchant-provided cross-sell suggestions.
            for (const recommendation of recommendedNames) {
              if (
                productText.includes(recommendation) ||
                recommendation.includes(product.title.toLowerCase()) ||
                recommendation.includes(
  (product.sku || "").toLowerCase()
)
              ) {
                score += 50;
              }
            }

            // Prefer products relevant to the buyer's use case.
            for (const word of purposeWords) {
              if (productText.includes(word)) {
                score += 5;
              }
            }

            score += Number(product.rating || 0);

            return { product, score };
          }
        );

        rankedAccessories.sort((a, b) => b.score - a.score);

        // Only recommend an accessory with an actual relevance signal.
        if (rankedAccessories[0]?.score > 4) {
          crossSellRecommendation =
            rankedAccessories[0].product;
        }
      }
    }

    const matchedProducts = scoredCandidates
      .slice(0, 5)
      .map((item) => item.product);

    let recommendationReason = "No matching products found.";

    if (primaryRecommendation) {
      const matched = scoredCandidates[0].matchedRequirements;

      recommendationReason =
        `Selected ${primaryRecommendation.title} because it best matches ` +
        `${intent.summary}.` +
        (matched.length
          ? ` Matching requirements: ${matched.join(", ")}.`
          : "") +
        ` Price: ₹${primaryRecommendation.price.toLocaleString("en-IN")}.` +
        (crossSellRecommendation
          ? ` Also found a potentially useful accessory: ${crossSellRecommendation.title}.`
          : "");
    }

    return {
      matchedProducts,
      primaryRecommendation,
      crossSellRecommendation,
      recommendationReason,
      queryUsed: {
        category: intent.category,
        maxBudget,
        budgetSpecified: hasBudget,
      },
    };
  }
}

module.exports = AgentService;
