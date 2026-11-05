import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OrderConfirmation from '../components/buyer/OrderConfirmation';
import { orderApi } from '../services/api';
import { RefreshCw, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function OrderConfirmationPage({ completedOrder, sessionId, onBackToStore }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');

  const [order, setOrder] = useState(completedOrder || null);
  const [loading, setLoading] = useState(!completedOrder);
  const [error, setError] = useState('');

  useEffect(() => {
    if (completedOrder) {
      setOrder(completedOrder);
      setLoading(false);
      return;
    }
    fetchOrderFromDatabase();
  }, [completedOrder, orderIdFromUrl, sessionId]);

  const fetchOrderFromDatabase = async () => {
    try {
      setLoading(true);
      setError('');

      if (orderIdFromUrl) {
        const res = await orderApi.getOrderById(orderIdFromUrl);
        if (res.data.order) {
          setOrder(res.data.order);
          return;
        }
      }

      // Fallback: fetch latest completed order for session
      const activeSession = sessionId || 'demo-session-1';
      const res = await orderApi.getSessionOrders(activeSession);
      if (res.data.orders && res.data.orders.length > 0) {
        setOrder(res.data.orders[0]); // most recent order
      } else {
        // Fallback: search all orders
        const allRes = await orderApi.getOrders({ limit: 1 });
        if (allRes.data.orders && allRes.data.orders.length > 0) {
          setOrder(allRes.data.orders[0]);
        } else {
          setError('No completed order receipts found in database.');
        }
      }
    } catch (err) {
      console.error('Failed to load order confirmation from database:', err);
      setError('Could not retrieve order details from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBackToStore) {
      onBackToStore();
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Retrieving Official Receipt...</h3>
        <p className="text-xs text-slate-500">Fetching order record and AI decision trail from database ledger.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Receipt Found</h2>
        <p className="text-xs text-slate-500 font-medium">
          {error || 'No recent order found in database for this session.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs"
          >
            View Purchase History in Profile
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      <OrderConfirmation
        completedOrder={order}
        sessionId={order.sessionId || sessionId}
        onBackToStore={handleBack}
      />
    </div>
  );
}

