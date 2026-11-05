import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const productApi = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getAiInspector: (id) => api.get(`/products/${id}/ai-inspector`),
};

export const policyApi = {
  getPolicy: () => api.get('/policy'),
  updatePolicy: (data) => api.put('/policy', data),
};

export const merchantApi = {
  getOverview: () => api.get('/merchant/overview'),
};

export const cartApi = {
  getCart: (sessionId) => api.get(`/cart/${sessionId}`),
  addToCart: (sessionId, itemData) => api.post(`/cart/${sessionId}/item`, itemData),
  removeFromCart: (sessionId, productId) => api.delete(`/cart/${sessionId}/item/${productId}`),
  clearCart: (sessionId) => api.post(`/cart/${sessionId}/clear`),
};

export const auditApi = {
  getEvents: (params) => api.get('/audit', { params }),
  getSessionTrail: (sessionId) => api.get(`/audit/${sessionId}`),
};

export const agentApi = {
  sendShoppingPrompt: (sessionId, message, autoPay = true) => api.post('/agent/chat', { sessionId, message, autoPay }),
};

export const paymentApi = {
  createPayPalOrder: (data) =>
    api.post('/payment/paypal/create-order', data),

  capturePayPalOrder: (data) =>
    api.post('/payment/paypal/capture-order', data),
};

export const customerApi = {
  getProfile: (sessionId) => api.get(`/customer/profile/${sessionId}`),
  updateProfile: (sessionId, data) => api.put(`/customer/profile/${sessionId}`, data),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getMe: (email) => api.get('/auth/me', { params: { email } }),
};

export const orderApi = {
  getOrders: (params) => api.get('/orders', { params }),
  getSessionOrders: (sessionId) => api.get(`/orders/session/${sessionId}`),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
};


export default api;
