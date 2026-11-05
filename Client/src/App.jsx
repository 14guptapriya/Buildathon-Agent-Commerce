import React, { useState, useEffect, useRef } from 'react';
import { policyApi, cartApi, customerApi, paymentApi } from './services/api';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import BuyerNavbar from './components/layout/BuyerNavbar';
import StorefrontPage from './pages/StorefrontPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import BuyerProfilePage from './pages/buyer/BuyerProfilePage';
import MerchantLayout from './pages/merchant/MerchantLayout';
import LoginPage from './pages/auth/LoginPage';
import AiShoppingChat from './components/buyer/AiShoppingChat';
import ApprovalModal from './components/buyer/ApprovalModal';
import CustomerProfileModal from './components/buyer/CustomerProfileModal';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const paypalReturnHandled = useRef(false);

  // Active Authenticated User State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessionId, setSessionId] = useState('demo-session-1');
  const [policy, setPolicy] = useState(null);
  const [cart, setCart] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [agentResponseData, setAgentResponseData] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  const isMerchantRoute = location.pathname.startsWith('/merchant');
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    fetchInitialData();
  }, [sessionId]);
   
  
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const paypalStatus = params.get("paypal");

  if (paypalStatus === "cancel") {
    navigate("/", { replace: true });
    return;
  }

  if (paypalStatus !== "return" || paypalReturnHandled.current) {
    return;
  }

  const paypalOrderId = params.get("token");
  const dbOrderId = params.get("dbOrderId");

  if (!paypalOrderId || !dbOrderId) {
    console.error("Missing PayPal return parameters.");
    return;
  }

  paypalReturnHandled.current = true;

  paymentApi
    .capturePayPalOrder({ paypalOrderId, dbOrderId })
    .then((res) => {
      if (!res.data?.success || !res.data?.order) {
        throw new Error(res.data?.message || "Payment capture was not confirmed.");
      }

      handlePaymentComplete(res.data.order);
    })
    .catch((err) => {
      console.error("PayPal capture failed:", err);
      window.alert(
        err.response?.data?.message ||
        err.message ||
        "PayPal payment could not be confirmed. Please check your order status."
      );
      navigate("/", { replace: true });
    });
}, [location.search, navigate]);

  const fetchInitialData = async () => {
    try {
      const [polRes, cartRes, custRes] = await Promise.all([
        policyApi.getPolicy(),
        cartApi.getCart(sessionId),
        customerApi.getProfile(sessionId),
      ]);
      setPolicy(polRes.data.policy);
      setCart(cartRes.data.cart);
      setCustomerProfile(custRes.data.customer);
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    }
  };

  const handleAgentResponse = (data) => {
    if (data.cart) {
      setCart(data.cart);
    }
    setAgentResponseData(data);

    // If AI Agent autonomously paid order under policy limit, transition straight to Order Confirmation Receipt!
    if (data.autoPaidOrder) {
      setTimeout(() => {
        handlePaymentComplete(data.autoPaidOrder);
      }, 600);
    }
  };

  const handleRequestApproval = (data) => {
    setAgentResponseData(data);
    setIsApprovalModalOpen(true);
  };

  const handlePaymentComplete = (order) => {
    setCompletedOrder(order);
    setIsApprovalModalOpen(false);
    setIsAiChatOpen(false);
    policyApi.getPolicy().then((res) => setPolicy(res.data.policy));
    const targetOrderNumber = order?.orderNumber || order?._id;
    if (targetOrderNumber) {
      navigate(`/order-confirmation?orderId=${targetOrderNumber}`);
    } else {
      navigate('/order-confirmation');
    }
  };

  const handleBackToStore = () => {
    const newSessionId = `session_${Date.now()}`;
    setCompletedOrder(null);
    setAgentResponseData(null);
    setIsAiChatOpen(false);
    setSessionId(newSessionId);
  };

  const handleAddToCart = async (product) => {
    try {
      const res = await cartApi.addToCart(sessionId, {
        productId: product._id,
        quantity: 1,
      });
      setCart(res.data.cart);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Show Buyer Navbar ONLY on Buyer pages when logged in */}
      {currentUser && currentUser.role === 'BUYER' && !isMerchantRoute && !isLoginPage && (
        <BuyerNavbar
          cartCount={cart?.items?.length || 0}
          openCart={() => setIsAiChatOpen(true)}
          openProfile={() => setIsProfileModalOpen(true)}
          customerProfile={customerProfile}
          buyerUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* Main Multi-Page Route Container */}
      <main className="flex-1">
        <Routes>
          {/* Single Unified Login Screen */}
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to={currentUser.role === 'MERCHANT' ? '/merchant' : '/'} replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          {/* Buyer Storefront Routes (Protected for BUYER role) */}
          <Route
            path="/"
            element={
              currentUser ? (
                currentUser.role === 'MERCHANT' ? (
                  <Navigate to="/merchant" replace />
                ) : (
                  <StorefrontPage
                    openAiChat={() => setIsAiChatOpen(true)}
                    policy={policy}
                    onAddToCart={handleAddToCart}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/store"
            element={
              currentUser ? (
                currentUser.role === 'MERCHANT' ? (
                  <Navigate to="/merchant" replace />
                ) : (
                  <StorefrontPage
                    openAiChat={() => setIsAiChatOpen(true)}
                    policy={policy}
                    onAddToCart={handleAddToCart}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              currentUser ? (
                <BuyerProfilePage
                  sessionId={sessionId}
                  buyerUser={currentUser}
                  openAiChat={() => setIsAiChatOpen(true)}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/order-confirmation"
            element={
              currentUser ? (
                <OrderConfirmationPage
                  completedOrder={completedOrder}
                  sessionId={sessionId}
                  onBackToStore={handleBackToStore}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Merchant Operations Console Route (Protected for MERCHANT role) */}
          <Route
            path="/merchant/*"
            element={
              currentUser && currentUser.role === 'MERCHANT' ? (
                <MerchantLayout policy={policy} setPolicy={setPolicy} merchantUser={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>

      {/* Floating AI Shopping Agent Chat Drawer (Buyer Side Only) */}
      {currentUser && currentUser.role === 'BUYER' && !isMerchantRoute && !isLoginPage && (
        <AiShoppingChat
          sessionId={sessionId}
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          onAgentResponse={handleAgentResponse}
          onRequestApproval={handleRequestApproval}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* High-Limit Spending Human Authorization Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        agentResponse={agentResponseData}
        onPaymentComplete={handlePaymentComplete}
        sessionId={sessionId}
      />

      {/* Buyer Customer Profile & Payment Vault Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        sessionId={sessionId}
        onProfileUpdated={(updatedCustomer) => setCustomerProfile(updatedCustomer)}
      />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
