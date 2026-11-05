
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Bot,
  ArrowRight,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { auditApi } from '../../services/api';

export default function OrderConfirmation({
  completedOrder,
  sessionId,
  onBackToStore
}) {
  const [auditTrail, setAuditTrail] = useState([]);
  const [loadingTrail, setLoadingTrail] = useState(true);

  const activeSessionId = completedOrder?.sessionId || sessionId;

  const isPaid =
    completedOrder?.status === 'paid' ||
    completedOrder?.paymentStatus === 'captured';

  const currency = 'USD';

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(Number(amount || 0));

  useEffect(() => {
    const fetchDecisionTrail = async () => {
      if (!activeSessionId) {
        setLoadingTrail(false);
        return;
      }

      try {
        setLoadingTrail(true);
        const res = await auditApi.getSessionTrail(activeSessionId);
        setAuditTrail(res.data.events || []);
      } catch (err) {
        console.error('Failed to fetch decision trail:', err);
      } finally {
        setLoadingTrail(false);
      }
    };

    fetchDecisionTrail();
  }, [activeSessionId]);

  if (!completedOrder) return null;

  const paymentId = completedOrder.paypalCaptureId;
  const paymentOrderId = completedOrder.paypalOrderId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto shadow-xs ${
          isPaid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
            : 'bg-amber-50 border-amber-200 text-amber-600'
        }`}>
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900">
          {isPaid ? 'Order Confirmed & Paid!' : 'Order Created'}
        </h1>

        <p className="text-sm text-slate-600">
          {isPaid
            ? 'PayPal payment verified server-side.'
            : 'Payment has not yet been confirmed by PayPal.'
          }{' '}
          Order <strong className="text-slate-900">
            #{completedOrder.orderNumber}
          </strong> stored in Database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Receipt Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs">

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>PayPal Payment Receipt</span>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isPaid ? 'PAID & VERIFIED' : 'PAYMENT PENDING'}
            </span>
          </div>

          <div className="space-y-3 text-xs">

            <div className="flex justify-between text-slate-500">
              <span>Order Number:</span>
              <span className="font-mono text-slate-900 font-semibold">
                #{completedOrder.orderNumber}
              </span>
            </div>

            <div className="flex justify-between text-slate-500 gap-3">
              <span>PayPal Capture ID:</span>
              <span className="font-mono text-indigo-700 font-bold break-all text-right">
                {paymentId || 'Not available'}
              </span>
            </div>

            <div className="flex justify-between text-slate-500 gap-3">
              <span>PayPal Order ID:</span>
              <span className="font-mono text-slate-700 break-all text-right">
                {paymentOrderId || 'Not available'}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Payment Provider:</span>
              <span className="font-semibold text-indigo-700">
                PayPal
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Approval Channel:</span>
              <span className="font-semibold text-indigo-700">
                {completedOrder.approvalDetails?.channel || 'Customer checkout'}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Created At:</span>
              <span className="text-slate-700 font-medium">
                {new Date(completedOrder.createdAt || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Items Purchased */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Items Purchased
            </span>

            {completedOrder.items?.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between gap-3 text-xs text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-600 font-mono font-bold">
                    {item.quantity}x
                  </span>
                  <span className="font-medium text-slate-900">
                    {item.title}
                  </span>
                </div>

                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {formatAmount(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold">
              Total Paid Amount:
            </span>
            <span className="text-xl font-extrabold text-slate-900">
              {formatAmount(completedOrder.totalAmount)}
            </span>
          </div>

          {completedOrder.sourceTotalAmountINR != null && (
            <div className="text-xs text-slate-500 text-right">
              Original cart amount: ₹
              {Number(completedOrder.sourceTotalAmountINR).toLocaleString('en-IN')}
            </div>
          )}

          <button
            onClick={onBackToStore}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center space-x-2"
          >
            <span>Back to Storefront</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* AI Decision Trail Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs">

          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>AI Decision Trail ("Why did the AI do this?")</span>
          </div>

          <p className="text-xs text-slate-500">
            Audit trail explaining the reasoning pipeline,
            policy validation checks, and customer authorization events.
          </p>

          {loadingTrail ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
              <p>Loading AI decision trail events...</p>
            </div>
          ) : auditTrail.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 shadow-xs">
              <p className="font-semibold text-emerald-700">
                ✓ Payment Verification Complete
              </p>
              <p className="text-[11px] text-slate-500">
                {completedOrder.aiAgentSession?.recommendationReason ||
                  completedOrder.approvalDetails?.reason ||
                  'Purchase evaluated against the configured spending policies.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {auditTrail.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      evt.actor === 'SALES_AGENT'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : evt.actor === 'SYSTEM_POLICY'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {evt.actor}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {evt.createdAt
                        ? new Date(evt.createdAt).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-xs">
                    {evt.title}
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {evt.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
