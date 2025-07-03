import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/user`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const orderService = {
  /**
   * Get user orders with pagination and filters
   * @param {Object} params - Query parameters
   */
  getUserOrders(params = {}) {
    return apiClient.get('/orders', { params });
  },

  /**
   * Get single order details
   * @param {string|number} id - Order ID
   */
  getOrder(id) {
    return apiClient.get(`/orders/${id}`);
  },

  /**
   * Get order statistics for current user
   */
  getOrderStatistics() {
    return apiClient.get('/orders/statistics/summary');
  },

  /**
   * Rate an order
   * @param {string|number} orderId - Order ID
   * @param {Object} ratingData - Rating data
   */
  rateOrder(orderId, ratingData) {
    return apiClient.post(`/orders/${orderId}/rating`, ratingData);
  },

  /**
   * Cancel an order
   * @param {string|number} orderId - Order ID
   * @param {string} reason - Cancellation reason
   */
  cancelOrder(orderId, reason) {
    return apiClient.patch(`/orders/${orderId}/cancel`, { reason });
  },

  /**
   * Track order status
   * @param {string|number} orderId - Order ID
   */
  trackOrder(orderId) {
    return apiClient.get(`/orders/${orderId}/track`);
  }
};