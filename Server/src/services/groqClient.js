
const OpenAI = require("openai");

let client;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from Server/.env");
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 30000,
      maxRetries: 2,
    });
  }

  return client;
}

module.exports = getGroqClient;
