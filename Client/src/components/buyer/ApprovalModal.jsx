
import React, { useState } from 'react';
import {
  Lock,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { paymentApi } from '../../services/api';

export default function ApprovalModal({
  isOpen,
  onClose,
  agentResponse,
  sessionId,
}) {
  const [authorizing, setAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !agentResponse) return null;

  const {
    cart,
    policyEvaluation,
    primaryProduct,
    crossSellProduct,
  } = agentResponse;

  const limit = policyEvaluation?.autonomousPurchaseLimit || 10000;
  const total = cart?.total || 0;

  const handlePayPalAuthorization = async () => {
    if (authorizing) return;

    setAuthorizing(true);
    setErrorMsg(null);

    try {
      const res = await paymentApi.createPayPalOrder({
        sessionId,
        cartId: cart.id || cart._id,
        isApproved: true,
      });

      if (!res.data?.success || !res.data?.approvalUrl) {
        throw new Error(
          res.data?.message || 'Could not start PayPal checkout.'
        );
      }

      // The buyer reviews and approves payment on PayPal.
      window.location.assign(res.data.approvalUrl);
    } catch (err) {
      console.error('PayPal checkout initialization failed:', err);

      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Unable to start PayPal checkout.'
      );

      setAuthorizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl border border-amber-200 shadow-2xl space-y-5 relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={authorizing}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Lock className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Human Spending Authorization Required
            </h3>
            <p className="text-xs text-amber-700 font-medium">
              Buyer approval required before payment
            </p>
          </div>
        </div>

        {/* Spending Limit Information */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 shadow-xs">
          <div className="flex justify-between font-semibold">
            <span>Requested Cart Total:</span>
            <span className="text-slate-900 font-extrabold text-sm">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between font-semibold text-slate-700">
            <span>Autonomous Purchase Limit:</span>
            <span>₹{limit.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-800 font-medium">
            The proposed purchase requires your approval. Review the cart
            and continue to PayPal if you wish to complete the purchase.
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cart Summary */}
        <div className="space-y-2 border-t border-b border-slate-100 py-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cart Breakdown
          </span>

          {primaryProduct && (
            <div className="flex justify-between text-xs text-slate-900 font-medium">
              <span>1x {primaryProduct.title}</span>
              <span className="font-bold">
                ₹{Number(primaryProduct.price || 0).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {crossSellProduct && (
            <div className="flex justify-between text-xs text-slate-600">
              <span>1x {crossSellProduct.title} (Recommended Accessory)</span>
              <span className="font-bold">
                ₹{Number(crossSellProduct.price || 0).toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={authorizing}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all shadow-xs disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handlePayPalAuthorization}
            disabled={authorizing}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {authorizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening PayPal...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Pay with PayPal</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400">
          Payment is completed only after PayPal approval and successful
          backend payment verification.
        </p>
      </div>
    </div>
  );
}
