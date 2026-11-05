# AgentRelay 🤖💳
### Autonomous Agent-to-Agent (A2A) Commerce & Payment Orchestration Platform

---

## 🌟 Overview

**AgentRelay** is an AI-powered autonomous commerce platform where Buyer AI Agents and Merchant AI Agents communicate, negotiate product recommendations, enforce spending policies, and orchestrate secure payments through **PayPal Checkout**.

Instead of manually searching product catalogs, comparing specifications, and navigating traditional checkout workflows, users can simply describe what they need in natural language.

The Buyer Agent interprets the user's intent and communicates with the Merchant Agent. The Merchant Agent searches available inventory, evaluates product options, applies merchant policies, and suggests relevant cross-sell products.

Before payment, AgentRelay's deterministic policy engine evaluates the proposed purchase against the buyer's configurable spending limit and merchant governance rules. Purchases exceeding the buyer's autonomous spending limit require explicit human approval.

Once authorized, the system redirects the buyer to PayPal to review and approve the payment.

**AgentRelay combines autonomous AI-driven commerce with deterministic financial governance and secure human-controlled payment authorization.**

---

## ✨ Key Features

### 1. 🤖 Dual Autonomous AI Agents

- **Buyer AI Agent:** Understands natural-language shopping requests, identifies user requirements, evaluates product specifications, compares options, and applies buyer spending preferences.
- **Merchant AI Agent:** Searches store inventory, checks product availability, evaluates merchant policies, and dynamically suggests relevant cross-sell products and bundles.

Example request:

*"Find me budget ANC headphones under ₹10,000 with good battery life."*

### 2. ⚡ 8-Step Inter-Agent (A2A) Protocol

Every shopping session follows a structured eight-step execution protocol:

1. **Buyer Intent Received:** The user submits a natural-language shopping request.
2. **Inter-Agent Query:** The Buyer Agent transmits a structured shopping intent to the Merchant Agent.
3. **Catalog & Inventory Evaluation:** The Merchant Agent searches the MongoDB product catalog and checks stock availability.
4. **Merchant Proposal Dispatched:** The Merchant Agent prepares product recommendations and optional cross-sell suggestions.
5. **Buyer Policy Evaluation:** The Buyer Agent evaluates the proposed cart against the buyer's configurable autonomous spending limit.
6. **Authorization Routing:**
   - **Within Spending Limit:** The purchase can proceed to the PayPal checkout flow without an additional AgentRelay spending-limit approval.
   - **Above Spending Limit:** AgentRelay triggers a Human Authorization Modal requiring explicit buyer approval before proceeding.
7. **PayPal Payment Orchestration:** The backend creates a PayPal checkout order, redirects the buyer to PayPal for authorization, and processes the payment confirmation.
8. **Audit Trail Logging:** Shopping events, policy decisions, authorization actions, and payment events are recorded in the database audit trail.

### 3. 💳 PayPal Checkout Integration

- **Secure Payment Orchestration:** AgentRelay integrates PayPal Checkout to facilitate secure online payments.
- **PayPal Authorization:** Buyers are redirected to PayPal to review and approve their transactions.
- **Human-in-the-Loop Governance:** Purchases exceeding the buyer's configured autonomous spending limit require explicit approval within AgentRelay before PayPal checkout.
- **Payment Confirmation:** The backend handles payment processing and confirmation, with successful transactions reflected in the order and receipt flow.

### 4. 🎨 Enterprise SaaS UI/UX

Inspired by modern financial and developer platforms such as Stripe, Linear, and Vercel.

**Buyer Portal:**
- Modern product storefront with category filtering.
- Natural-language AI shopping assistant.
- Product recommendations and cross-sell suggestions.
- Editable buyer profile and autonomous spending limit.
- Human authorization modal.
- PayPal checkout redirection.
- Order history and payment receipts.

**Merchant Console:**
- Revenue and transaction metrics.
- Product catalog management.
- AI-powered product specification inspection.
- Merchant policy and spending guardrails.
- Transaction activity feed.
- Expandable A2A dialogue timelines and audit logs.

### 5. 🛡️ PII Masking & Customer Privacy

Customer identities in merchant-facing audit trails and A2A transaction logs are masked to reduce unnecessary exposure of personally identifiable information.

Examples:
- `alex@****.ai`
- `Alex V.`

This helps maintain auditability while limiting exposure of customer information.

---

## 🏗️ Architecture & Technology Stack

### Frontend (Client)

| Technology | Purpose |
|---|---|
| React 18 | Frontend framework |
| Vite 8 | Development and build tooling |
| Tailwind CSS | Styling and responsive UI |
| Lucide React | Icons |
| React Router DOM v6 | Client-side routing |
| Axios | API communication |

### Backend (Server)

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | ODM |
| PayPal Checkout API | Payment orchestration |
| Groq LLM API | AI-powered shopping conversations |
| JWT | Authentication |
| REST Architecture | Controller-Service-Model structure |

---

## 📁 Repository Structure

```text
Buildathon-Agent-Commerce/
│
├── Client/                         # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── buyer/              # BuyerStorefront, AiShoppingChat,
│   │   │   │                       # ApprovalModal, CustomerProfileModal,
│   │   │   │                       # OrderConfirmation
│   │   │   ├── layout/             # Navigation components
│   │   │   └── merchant/           # MerchantDashboard
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/               # Authentication pages
│   │   │   ├── buyer/              # Buyer profile
│   │   │   ├── merchant/           # Merchant console
│   │   │   ├── OrderConfirmationPage.jsx
│   │   │   └── StorefrontPage.jsx
│   │   │
│   │   ├── services/               # Axios API services
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── Server/                         # Node.js Backend
│   ├── src/
│   │   ├── config/                 # Database configuration
│   │   ├── controllers/            # API controllers
│   │   ├── models/                 # MongoDB models
│   │   ├── routes/                 # Express routes
│   │   ├── services/               # Agent, payment and policy services
│   │   ├── seed.js                 # Database seeder
│   │   └── app.js
│   │
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- MongoDB local instance or MongoDB Atlas account
- PayPal Developer account
- Groq API key

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd Server
```

Install dependencies:

```bash
npm install
```

Create your `.env` file using `.env.example` as a reference.

**Example environment configuration:**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/agent_commerce

JWT_SECRET=replace_with_a_secure_random_secret

GROQ_API_KEY=your_groq_api_key

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
```

Use the exact environment variable names expected by your backend implementation. Never commit your actual API keys, client secrets, or `.env` file.

Seed the database:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Backend development server:

`http://localhost:5000`

### 2. Frontend Setup

Open a new terminal:

```bash
cd Client
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend development server:

`http://localhost:5173`

---

## 🔑 Demo Login Credentials

Use the quick-fill options on the login screen:

`http://localhost:5173/login`

| Role | Email | Password | Access |
|---|---|---|---|
| Buyer | `buyer@agentrelay.ai` | `buyer123` | Storefront, AI Shopping, Profile, Checkout and Order History |
| Merchant | `merchant@agentrelay.ai` | `admin123` | Merchant Dashboard, Policy Editor, Catalog and Audit Logs |

*These are development demo credentials. Change them before any production deployment.*

---

## 🧪 Testing the Autonomous AI Flow

### 1. Buyer Shopping Flow

1. Log in as the Buyer.
2. Open the storefront.
3. Launch the AI Sales Agent.
4. Submit a natural-language shopping request.

Example:

*"Find budget ANC headphones under ₹10,000."*

The Buyer Agent interprets the request and communicates with the Merchant Agent to discover suitable products.

### 2. Spending Limit & Human Approval

Update the autonomous spending limit from the buyer profile.

For example, configure the buyer's spending limit to ₹15,000.

| Purchase Amount | Expected Behaviour |
|---|---|
| ₹10,000 | No additional spending-limit approval |
| ₹14,999 | No additional spending-limit approval |
| ₹15,001 | Human approval required |
| ₹20,000 | Human approval required |

The policy engine evaluates the cart against the buyer's configured limit rather than relying on a fixed ₹10,000 buyer threshold.

### 3. PayPal Checkout

1. Submit a shopping request.
2. Review the AI-generated product proposal.
3. Review the cart and any applicable authorization requirement.
4. Approve the purchase if human authorization is required.
5. Proceed to PayPal Checkout.
6. Authorize the payment through PayPal.
7. Return to AgentRelay and verify the order confirmation and receipt.

For development, use PayPal Sandbox accounts and credentials.

### 4. Merchant Dashboard

Log in as the Merchant to explore:

- Revenue and transaction metrics.
- Product inventory and catalog.
- AI product specification inspection.
- Merchant policy controls.
- A2A interaction timelines.
- Transaction and audit logs.

---

## 🔐 Security & Governance

AgentRelay separates AI-driven decision-making from deterministic financial policy enforcement.

- The AI agents recommend and negotiate; they do not independently bypass policy checks.
- Buyer spending limits are configurable.
- Merchant daily spending and discount restrictions are enforced separately.
- Purchases above the buyer's autonomous spending limit require explicit human authorization.
- PayPal handles the payment authorization flow.
- Backend payment processing and confirmation are handled separately from AI recommendations.
- Audit events provide visibility into agent decisions and transaction activity.

---

## 📜 License

This project is distributed under the MIT License.

Built as part of the **PayPal Hackathon**.