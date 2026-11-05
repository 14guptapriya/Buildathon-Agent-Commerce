
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const BuyerAgentService = require("../services/buyerAgentService");

async function testBuyerAgent() {
  try {
    const message =
      "I need wireless ANC headphones for travelling, " +
      "with good battery life, under 10k. Suggest useful accessories too.";

    console.log("\nUSER REQUEST:");
    console.log(message);

    const result = await BuyerAgentService.understandRequest(message);

    console.log("\nBUYER AI AGENT RESPONSE:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\nBUYER AGENT TEST FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

testBuyerAgent();
