import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Activity, 
  Loader2,
  Lock,
  Trash2
} from 'lucide-react';
import { agentApi, paymentApi } from '../../services/api';

export default function AiShoppingChat({ sessionId, onAgentResponse, onRequestApproval, onPaymentComplete, isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [chatResult, setChatResult] = useState(null);

  const samplePrompts = [
    'Find budget ANC headphones under ₹10,000.',
    'I need a MacBook Air for computing under ₹100,000.',
    'Find a 5G smartphone with magnetic power bank under ₹60,000.',
    'Show me 4K vlogging cameras for travel under ₹40,000.',
    'Find a travel backpack with USB charging port under ₹5,000.',
  ];

  // Automatically reset chat when session ID changes (e.g. after order completion)
  useEffect(() => {
    setChatResult(null);
    setPrompt('');
  }, [sessionId]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setChatResult(null);

    try {
      const res = await agentApi.sendShoppingPrompt(sessionId, textToSend);
      setChatResult(res.data);
      if (onAgentResponse) {
        onAgentResponse(res.data);
      }

      // Check if policy triggers human approval
      if (res.data.policyEvaluation?.requiresApproval) {
        onRequestApproval(res.data);
      }
    } catch (err) {
      console.error('Agent chat failed:', err);
    } finally {
      setLoading(false);
    }
  };

  
const handleDirectCheckout = async () => {
  if (!chatResult || checkingOut) return;

  setCheckingOut(true);

  try {
    const res = await paymentApi.createPayPalOrder({
      sessionId,
      cartId: chatResult.cart?.id || chatResult.cart?._id,
      isApproved: true,
    });

    const { approvalUrl } = res.data;

    if (!approvalUrl) {
      throw new Error("PayPal approval URL was not returned by the backend.");
    }

    // Redirect buyer to PayPal Sandbox for payment approval
    window.location.assign(approvalUrl);

  } catch (err) {
    console.error(
      "PayPal checkout failed:",
      err.response?.data || err.message
    );

    alert(
      err.response?.data?.message ||
      err.message ||
      "Unable to initiate PayPal checkout."
    );

    setCheckingOut(false);
  }
};

  const clearChat = () => {
    setChatResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">AI Shopping Sales Agent</h3>
            <p className="text-[11px] text-slate-500">Natural Language Commerce Agent</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {chatResult && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 text-xs flex items-center space-x-1 shadow-xs transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Clear</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white text-slate-400 hover:text-slate-700 border border-slate-200 text-xs shadow-xs transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Chat Body & Tool Calls */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/50">
        
        {/* Sample Prompt Suggestions */}
        {!chatResult && !loading && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Try asking the agent:</p>
            <div className="space-y-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleSend(p);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-white hover:bg-indigo-50/50 hover:border-indigo-300 border border-slate-200 text-xs text-slate-700 font-medium transition-all shadow-xs flex items-center justify-between group"
                >
                  <span>"{p}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator with Agent Thought Loop */}
        {loading && (
          <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3 text-center shadow-xs">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-indigo-900">Evaluating Catalog & Enforcing Policy...</p>
            <div className="text-[11px] text-indigo-700/80 space-y-1 font-medium">
              <div>• OBSERVE: Parsing user prompt intent</div>
              <div>• REASON: Searching merchant catalog items</div>
              <div>• POLICY CHECK: Evaluating buyer spending limit</div>
            </div>
          </div>
        )}

        {/* Agent Execution Result */}
        {chatResult && (
          <div className="space-y-5 animate-in fade-in duration-300">
            
            {/* Intent Badge */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Customer Intent</span>
              <p className="text-xs text-slate-800 font-medium">{chatResult.intentSummary}</p>
            </div>

            {/* 8-Step Agent-to-Agent (A2A) Live Dialogue & Protocol Trace */}
            {chatResult.a2aProtocolSteps && chatResult.a2aProtocolSteps.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-900 tracking-wide">Live Inter-Agent (A2A) Dialogue</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                    Dual Autonomous Policy
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {chatResult.a2aProtocolSteps.map((step, idx) => {
                    const isBuyer = step.sender === 'BUYER_AGENT' || step.sender === 'BUYER_HUMAN';
                    const isMerchant = step.sender === 'MERCHANT_AGENT';
                    const isPayment = step.sender === 'PAYMENT_SERVICE';

                    return (
                      <div key={idx} className={`flex items-start space-x-2.5 ${isMerchant ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Agent Avatar Icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border shadow-xs ${
                          isBuyer ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                          isMerchant ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          isPayment ? 'bg-sky-50 border-sky-200 text-sky-700' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {isBuyer ? '🤖' : isMerchant ? '🏪' : isPayment ? '💳' : '🛡️'}
                        </div>

                        {/* Speech Bubble */}
                        <div className={`flex-1 p-2.5 rounded-xl text-xs space-y-1 border shadow-xs ${
                          isBuyer ? 'bg-indigo-50/70 border-indigo-100 text-slate-800' :
                          isMerchant ? 'bg-emerald-50/70 border-emerald-100 text-slate-800' :
                          isPayment ? 'bg-sky-50/70 border-sky-100 text-slate-800' :
                          'bg-amber-50/70 border-amber-100 text-slate-800'
                        }`}>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`font-mono font-bold ${
                              isBuyer ? 'text-indigo-700' :
                              isMerchant ? 'text-emerald-700' :
                              isPayment ? 'text-sky-700' :
                              'text-amber-700'
                            }`}>
                              {step.sender.replace('_', ' ')} → {step.receiver.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">Step {step.stepNumber}</span>
                          </div>

                          <p className="font-medium leading-relaxed text-slate-800">{step.message}</p>
                          {step.detail && (
                            <p className="text-[10px] text-slate-500 border-t border-slate-200/80 pt-1 mt-1 font-mono">
                              💡 {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendation Card */}
            {chatResult.primaryProduct && (
              <div className="p-4 rounded-xl bg-white border border-indigo-100 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Primary Recommendation
                  </span>
                  <span className="text-xs text-amber-600 font-bold">★ {chatResult.primaryProduct.rating || 4.8}</span>
                </div>

                <div className="flex space-x-3">
                  <img
                    src={chatResult.primaryProduct.imageUrl}
                    alt={chatResult.primaryProduct.title}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shadow-xs"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800';
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{chatResult.primaryProduct.title}</h4>
                    <div className="text-sm font-extrabold text-indigo-600 mt-0.5">
                      ₹{chatResult.primaryProduct.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                  "{chatResult.recommendationReason}"
                </p>

                {/* Cross-Sell Bundle Option */}
                {chatResult.crossSellProduct && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-800">Cross-sell Accessory Suggested</span>
                      <span className="font-bold text-slate-900">₹{chatResult.crossSellProduct.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium">{chatResult.crossSellProduct.title}</p>
                  </div>
                )}
              </div>
            )}

            {/* Policy Enforcement Warning / Status */}
            {chatResult.policyEvaluation && (
              <div className={`p-4 rounded-xl border space-y-2 shadow-xs ${
                chatResult.policyEvaluation.requiresApproval
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2 text-xs font-bold">
                  {chatResult.policyEvaluation.requiresApproval ? (
                    <Lock className="w-4 h-4 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {chatResult.policyEvaluation.requiresApproval
                      ? 'Human Authorization Required'
                      : 'Autonomous Limit Check Passed'}
                  </span>
                </div>

                <p className="text-xs opacity-90 font-medium">
                  {chatResult.policyEvaluation.reasons?.[0]}
                </p>

                {chatResult.policyEvaluation.requiresApproval ? (
                  <button
                    onClick={() => onRequestApproval(chatResult)}
                    className="w-full mt-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-2"
                  >
                    <span>Authorize Purchase (₹{chatResult.cart?.total?.toLocaleString()})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleDirectCheckout}
                    disabled={checkingOut}
                    className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-2"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Redirecting to PayPal...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Proceed to Checkout & Pay (₹{chatResult.cart?.total?.toLocaleString()})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Chat Prompt Footer Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI agent for recommendations (e.g. Find travel headphones under ₹20k)..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}

