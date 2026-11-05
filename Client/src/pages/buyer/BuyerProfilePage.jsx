
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Cpu,
  Lock,
  AlertTriangle,
  Eye,
  Store,
  ChevronRight,
  Wallet,
} from 'lucide-react';

import {
  orderApi,
  customerApi,
  auditApi,
} from '../../services/api';

import CustomerProfileModal from '../../components/buyer/CustomerProfileModal';

export default function BuyerProfilePage({
  sessionId,
  buyerUser,
  openAiChat,
}) {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [customerProfile, setCustomerProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [selectedAuditOrder, setSelectedAuditOrder] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchOrders();
      fetchProfile();
    }
  }, [sessionId]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await orderApi.getOrders();
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await customerApi.getProfile(sessionId);

      if (res.data.customer) {
        setCustomerProfile(res.data.customer);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const spendingLimit =
    customerProfile?.autonomousSpendingLimit ?? 10000;

  const openOrderAuditModal = async (order) => {
    setSelectedAuditOrder(order);
    setAuditEvents([]);

    try {
      setLoadingAudit(true);

      const targetSession = order.sessionId || sessionId;
      const res = await auditApi.getSessionTrail(targetSession);

      setAuditEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load decision trail:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row font-sans">

      {/* BUYER SIDEBAR */}
      <aside className="w-full md:w-72 border-r border-slate-200 bg-white p-5 space-y-6 shrink-0 flex flex-col justify-between shadow-xs">

        <div className="space-y-6">

          {/* USER PROFILE */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <User className="w-5 h-5" />
              </div>

              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  {buyerUser?.name || 'Buyer'}
                </h3>

                <p className="text-xs text-slate-500 truncate">
                  {buyerUser?.email || 'Buyer account'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">
                Session ID:
              </span>

              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                {sessionId || 'N/A'}
              </span>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Buyer Dashboard
            </span>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Purchase History</span>
              </div>

              {orders.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] rounded-full font-mono font-bold bg-white/20">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4" />
                <span>Payment & Security</span>
              </div>

              <ShieldCheck className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'ai-assistant'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Cpu className="w-4 h-4" />
                <span>AI Agent & Controls</span>
              </div>

              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* STOREFRONT SHORTCUT */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Navigation Shortcut
            </span>

            <Link
              to="/"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 shadow-xs"
            >
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Back to Storefront Catalog</span>
            </Link>
          </div>
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="pt-6 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Buyer-Controlled Payments</span>
            </div>

            <p className="text-[11px] text-slate-600 font-medium">
              Every purchase requires buyer approval through PayPal checkout.
            </p>
          </div>

          <button
            onClick={openAiChat}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Launch AI Agent Chat</span>
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">

        {/* SUMMARY BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === 'orders' && 'Purchase History & Orders'}
                  {activeTab === 'security' && 'Payment & Security'}
                  {activeTab === 'ai-assistant' && 'AI Agent & Shopping Controls'}
                </h1>

                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Buyer Account
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Manage purchases, review payment security, and inspect AI decision trails.
              </p>
            </div>

            <button
              onClick={openAiChat}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center space-x-2 shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Agent</span>
            </button>
          </div>

          {/* METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Total Orders
              </span>

              <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                <span>{orders.length}</span>
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Payment Provider
              </span>

              <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                <span className="text-base text-indigo-700">PayPal</span>
                <CreditCard className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Purchase Evaluation Threshold
              </span>

              <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                <span className="text-base text-indigo-700">
                  ₹{Number(spendingLimit).toLocaleString('en-IN')}
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: PURCHASE HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-6">

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Your Orders & Transactions
              </h2>

              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-medium">
                  Loading purchase history...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>

                <h3 className="text-base font-semibold text-slate-900">
                  No Purchase History Yet
                </h3>

                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't placed any orders yet. Ask the AI Buyer Agent to discover products and prepare a purchase proposal.
                </p>

                <button
                  onClick={openAiChat}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs inline-flex items-center gap-2 hover:bg-indigo-700 shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Start AI Shopping Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all space-y-4 shadow-xs"
                  >

                    {/* ORDER HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            Order #{order.orderNumber}
                          </span>

                          {order.status === 'paid' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid & Confirmed
                            </span>
                          )}

                          {order.status === 'awaiting_approval' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Awaiting Human Approval
                            </span>
                          )}

                          {order.isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Human Approved
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </div>

                        <p className="text-[11px] font-mono text-slate-500">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                    </div>

                    {/* ORDER ITEMS */}
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center space-x-3">
                            {item.product?.image ? (
                              <img
                                src={item.product.image}
                                alt={item.title}
                                className="w-9 h-9 object-cover rounded-md border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-md bg-slate-200 flex items-center justify-center text-slate-500">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}

                            <div>
                              <p className="font-medium text-slate-900">
                                {item.title}
                              </p>

                              <p className="text-[11px] text-slate-500">
                                Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <span className="font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* PAYPAL DETAILS AND AUDIT */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="space-y-1 font-mono text-slate-500 break-all">
                        {order.paypalCaptureId && (
                          <div>
                            <span className="text-slate-400">
                              PayPal Capture ID:{' '}
                            </span>
                            <span className="text-indigo-700 font-semibold">
                              {order.paypalCaptureId}
                            </span>
                          </div>
                        )}

                        {order.paypalOrderId && (
                          <div>
                            <span className="text-slate-400">
                              PayPal Order ID:{' '}
                            </span>
                            <span className="text-slate-700">
                              {order.paypalOrderId}
                            </span>
                          </div>
                        )}

                        {!order.paypalCaptureId && !order.paypalOrderId && (
                          <span className="text-slate-400">
                            PayPal payment details unavailable
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => openOrderAuditModal(order)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1.5 transition-all text-xs shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View AI Decision Trail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT & SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-6">

            {/* PAYPAL INTEGRATION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Buyer-Controlled PayPal Checkout
                  </h2>

                  <p className="text-xs text-slate-500">
                    Secure payment authorization and verification
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  PayPal Integration
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  AgentRelay redirects buyers to PayPal to review and approve their payment. The backend verifies the PayPal capture before marking an order as paid and completing fulfillment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Buyer Authorization
                  </h3>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    The AI agent can prepare a purchase proposal, but it cannot independently charge the buyer. The buyer must approve checkout through PayPal.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Server-Side Verification
                  </h3>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Payment capture details are verified by the backend before order completion and inventory updates.
                  </p>
                </div>
              </div>
            </div>

            {/* AI SPENDING POLICY */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">

              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />

                <h2 className="text-base font-bold text-slate-900">
                  AI Spending Policy
                </h2>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Before presenting a purchase proposal, AgentRelay evaluates its total against the configured buyer spending threshold and applicable policy rules.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">

                <div>
                  <span className="text-[11px] text-slate-500 block">
                    Current Evaluation Threshold
                  </span>

                  <strong className="text-2xl text-slate-900">
                    ₹{Number(spendingLimit).toLocaleString('en-IN')}
                  </strong>
                </div>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Wallet className="w-4 h-4" />
                  Edit Spending Limit
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                This threshold is a purchase-policy setting, not payment authorization or permission for automatic charging. PayPal approval is still required.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: AI AGENT & CONTROLS */}
        {activeTab === 'ai-assistant' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">

              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                AI Agent Shopping Workflow
              </h2>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                AgentRelay coordinates a Buyer Agent and Merchant Agent to understand shopping requirements, discover products, exchange proposals, evaluate spending policies, and prepare a buyer-approved checkout.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    AI Buyer Agent
                  </span>

                  <h4 className="text-xs font-bold text-slate-900">
                    Understand & Evaluate
                  </h4>

                  <p className="text-[11px] text-slate-600">
                    Understands the buyer's intent, budget, requirements, and preferences before evaluating merchant proposals.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    AI Merchant Agent
                  </span>

                  <h4 className="text-xs font-bold text-slate-900">
                    Discover & Propose
                  </h4>

                  <p className="text-[11px] text-slate-600">
                    Searches available products, checks inventory, and proposes suitable products and compatible accessories.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                  <Lock className="w-4 h-4" />
                  Buyer Approval Required
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Spending-policy evaluation does not execute payment. The buyer reviews the proposed cart and approves payment through PayPal.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={openAiChat}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Open AI Shopping Drawer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI DECISION TRAIL AUDIT MODAL */}
      {selectedAuditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">

          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    AI Decision & Policy Audit Trail
                  </h3>

                  <p className="text-xs font-mono text-slate-500">
                    Order #{selectedAuditOrder.orderNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAuditOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
              >
                ✕
              </button>
            </div>

            {/* PAYMENT SUMMARY */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">

              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500 font-medium">
                  PayPal Capture ID:
                </span>

                <span className="font-mono text-indigo-700 font-bold break-all text-right">
                  {selectedAuditOrder.paypalCaptureId || 'Not available'}
                </span>
              </div>

              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500 font-medium">
                  PayPal Order ID:
                </span>

                <span className="font-mono text-slate-700 break-all text-right">
                  {selectedAuditOrder.paypalOrderId || 'Not available'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  Original Order Amount:
                </span>

                <span className="font-bold text-slate-900 text-sm">
                  ₹{selectedAuditOrder.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* AUDIT TIMELINE */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Decision & Verification Logs
              </h4>

              {loadingAudit ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
                  <p>Loading AI audit events...</p>
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-center font-medium">
                  No audit events are available for this session.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                        <span className="text-indigo-700 font-semibold">
                          {evt.eventType}
                        </span>

                        <span className="text-slate-400">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-slate-800 font-medium">
                        {evt.description}
                      </p>

                      {evt.metadata?.ruleEvaluations && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] font-mono text-emerald-700">
                          Policy Compliance: Rule evaluations recorded.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAuditOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUYER PROFILE MODAL - OUTSIDE BOTH TAB AND AUDIT CONDITIONS */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        sessionId={sessionId}
        onProfileUpdated={(updatedCustomer) => {
          setCustomerProfile(updatedCustomer);
        }}
      />

    </div>
  );
}
