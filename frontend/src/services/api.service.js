import axios from 'axios';
import store from '../store';
import router from '../router';
import { API_URL } from '../config';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle session expiration (401 Unauthorized)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Log the user out and redirect to login page
      await store.dispatch('logout');
      router.push('/auth/login');
      
      store.dispatch('ui/showSnackbar', {
        text: 'Your session has expired. Please log in again.',
        color: 'error'
      });
    }
    
    // Handle forbidden errors (403)
    if (error.response && error.response.status === 403) {
      store.dispatch('ui/showSnackbar', {
        text: 'You don\'t have permission to perform this action',
        color: 'error'
      });
    }
    
    // Handle not found errors (404)
    if (error.response && error.response.status === 404) {
      // For specific API endpoints, we might want to handle differently
      if (originalRequest.url.includes('/restaurants/')) {
        store.dispatch('ui/showSnackbar', {
          text: 'Restaurant not found',
          color: 'error'
        });
      }
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      store.dispatch('ui/showSnackbar', {
        text: 'Server error. Please try again later.',
        color: 'error'
      });
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      store.dispatch('ui/showSnackbar', {
        text: 'Network error. Please check your internet connection.',
        color: 'error'
      });
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      store.dispatch('ui/showSnackbar', {
        text: 'Request timed out. Please try again.',
        color: 'error'
      });
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
const auth = {
  // Register a new user
  register: (userData) => {
    return apiClient.post('/api/auth/register', userData);
  },
  
  // Login with email and password
  login: (email, password) => {
    return apiClient.post('/api/auth/login', { email, password });
  },
  
  // Request password reset
  requestPasswordReset: (email) => {
    return apiClient.post('/api/auth/password/request-reset', { email });
  },
  
  // Reset password with token
  resetPassword: (token, newPassword) => {
    return apiClient.post('/api/auth/password/reset', { token, newPassword });
  },
  
  // Request phone verification code
  requestPhoneVerification: (phone) => {
    return apiClient.post('/api/auth/phone/request', { phone });
  },
  
  // Verify phone code
  verifyPhoneCode: (phone, code) => {
    return apiClient.post('/api/auth/phone/verify', { phone, code });
  },
  
  // Social login
  socialLogin: (provider, data) => {
    return apiClient.post('/api/auth/social', {
      provider,
      providerId: data.userId || data.sub,
      email: data.email,
      name: data.name,
      avatar: data.picture
    });
  },
  
  // Google login
  loginWithGoogle: (idToken) => {
    return apiClient.post('/api/auth/login/google', { idToken });
  },
  
  // Facebook login
  loginWithFacebook: (accessToken) => {
    return apiClient.post('/api/auth/login/facebook', { accessToken });
  }
};

// User API
export const userAPI = {
  getProfile: () => {
    return apiClient.get('/api/user/profile');
  },
  updateProfile: (userData) => {
    return apiClient.put('/api/user/profile', userData);
  },
  getAddresses: () => {
    return apiClient.get('/api/user/addresses');
  },
  addAddress: (addressData) => {
    return apiClient.post('/api/user/addresses', addressData);
  },
  updateAddress: (id, addressData) => {
    return apiClient.put(`/api/user/addresses/${id}`, addressData);
  },
  deleteAddress: (id) => {
    return apiClient.delete(`/api/user/addresses/${id}`);
  },
  setDefaultAddress: (id) => {
    return apiClient.put(`/api/user/addresses/${id}/default`);
  }
};

// Restaurant API
export const restaurantAPI = {
  getAllRestaurants: (params) => {
    return apiClient.get('/api/restaurants', { params });
  },
  getFeaturedRestaurants: (limit = 5) => {
    return apiClient.get('/api/restaurants/featured', { params: { limit } });
  },
  getNearbyRestaurants: (lat, lng, radius, limit) => {
    return apiClient.get('/api/restaurants/nearby', { params: { lat, lng, radius, limit } });
  },
  getRestaurantById: (id) => {
    return apiClient.get(`/api/restaurants/${id}`);
  },
  getRestaurantMenu: (id, categoryId) => {
    return apiClient.get(`/api/restaurants/${id}/menu`, { params: { categoryId } });
  },
  getRestaurantReviews: (id, page = 1, limit = 10) => {
    return apiClient.get(`/api/restaurants/${id}/reviews`, { params: { page, limit } });
  },
  createRestaurant: (restaurantData) => {
    return apiClient.post('/api/restaurants', restaurantData);
  },
  updateRestaurant: (id, restaurantData) => {
    return apiClient.put(`/api/restaurants/${id}`, restaurantData);
  },
  deleteRestaurant: (id) => {
    return apiClient.delete(`/api/restaurants/${id}`);
  },
  toggleOpenStatus: (id, isOpen) => {
    return apiClient.put(`/api/restaurants/${id}/status`, { isOpen });
  },
  replyToReview: (restaurantId, reviewId, reply) => {
    return apiClient.post(`/api/restaurants/${restaurantId}/reviews/${reviewId}/reply`, { reply });
  }
};

// Menu API (for restaurant admin)
export const menuAPI = {
  getMenuItems: (restaurantId) => {
    return apiClient.get(`/api/restaurants/${restaurantId}/menu`);
  },
  createMenuItem: (restaurantId, itemData) => {
    // Use FormData for multipart/form-data (with image upload)
    const formData = new FormData();
    
    // Append all properties from itemData
    for (const key in itemData) {
      if (key === 'options' && typeof itemData[key] === 'object') {
        formData.append(key, JSON.stringify(itemData[key]));
      } else if (key === 'image' && itemData[key] instanceof File) {
        formData.append(key, itemData[key]);
      } else {
        formData.append(key, itemData[key]);
      }
    }
    
    return apiClient.post(`/api/restaurants/${restaurantId}/menu`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateMenuItem: (restaurantId, itemId, itemData) => {
    // Use FormData for multipart/form-data (with image upload)
    const formData = new FormData();
    
    // Append all properties from itemData
    for (const key in itemData) {
      if (key === 'options' && typeof itemData[key] === 'object') {
        formData.append(key, JSON.stringify(itemData[key]));
      } else if (key === 'image' && itemData[key] instanceof File) {
        formData.append(key, itemData[key]);
      } else {
        formData.append(key, itemData[key]);
      }
    }
    
    return apiClient.put(`/api/restaurants/${restaurantId}/menu/${itemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteMenuItem: (restaurantId, itemId) => {
    return apiClient.delete(`/api/restaurants/${restaurantId}/menu/${itemId}`);
  },
  toggleItemAvailability: (restaurantId, itemId, isAvailable) => {
    return apiClient.put(`/api/restaurants/${restaurantId}/menu/${itemId}/availability`, {
      isAvailable
    });
  },
  createMenuCategory: (restaurantId, categoryData) => {
    return apiClient.post(`/api/restaurants/${restaurantId}/menu-categories`, categoryData);
  },
  updateMenuCategory: (restaurantId, categoryId, categoryData) => {
    return apiClient.put(`/api/restaurants/${restaurantId}/menu-categories/${categoryId}`, categoryData);
  },
  deleteMenuCategory: (restaurantId, categoryId) => {
    return apiClient.delete(`/api/restaurants/${restaurantId}/menu-categories/${categoryId}`);
  }
};

// Order API
export const orderAPI = {
  createOrder: (orderData) => {
    return apiClient.post('/api/orders', orderData);
  },
  getUserOrders: (params) => {
    return apiClient.get('/api/orders', { params });
  },
  getOrderById: (id) => {
    return apiClient.get(`/api/orders/${id}`);
  },
  getOrderByNumber: (orderNumber) => {
    return apiClient.get(`/api/orders/number/${orderNumber}`);
  },
  trackOrder: (id) => {
    return apiClient.get(`/api/orders/${id}/track`);
  },
  updateOrderStatus: (id, status) => {
    return apiClient.put(`/api/orders/${id}/status`, { status });
  },
  cancelOrder: (id, reason) => {
    return apiClient.post(`/api/orders/${id}/cancel`, { reason });
  },
  addOrderReview: (id, reviewData) => {
    return apiClient.post(`/api/orders/${id}/review`, reviewData);
  },
  reorder: (id, orderData) => {
    return apiClient.post(`/api/orders/${id}/reorder`, orderData);
  }
};

// Restaurant Admin API
export const restaurantAdminAPI = {
  getDashboard: (restaurantId) => {
    return apiClient.get(`/api/restaurant-admin/dashboard/${restaurantId}`);
  },
  getOrders: (restaurantId, params) => {
    return apiClient.get(`/api/restaurant-admin/restaurants/${restaurantId}/orders`, { params });
  },
  getAnalytics: (restaurantId, timeframe = 'month') => {
    return apiClient.get(`/api/restaurant-admin/restaurants/${restaurantId}/analytics`, { 
      params: { timeframe } 
    });
  },
  createPromotion: (restaurantId, promotionData) => {
    return apiClient.post(`/api/restaurant-admin/restaurants/${restaurantId}/promotions`, promotionData);
  },
  updatePromotion: (restaurantId, promotionId, promotionData) => {
    return apiClient.put(`/api/restaurant-admin/restaurants/${restaurantId}/promotions/${promotionId}`, promotionData);
  },
  deletePromotion: (restaurantId, promotionId) => {
    return apiClient.delete(`/api/restaurant-admin/restaurants/${restaurantId}/promotions/${promotionId}`);
  },
  getPromotions: (restaurantId) => {
    return apiClient.get(`/api/restaurant-admin/restaurants/${restaurantId}/promotions`);
  },
  getSettings: (restaurantId) => {
    return apiClient.get(`/api/restaurant-admin/restaurants/${restaurantId}/settings`);
  },
  updateSettings: (restaurantId, settingsData) => {
    return apiClient.put(`/api/restaurant-admin/restaurants/${restaurantId}/settings`, settingsData);
  }
};

// Driver API
export const driverAPI = {
  getProfile: () => {
    return apiClient.get('/api/driver/profile');
  },
  updateProfile: (profileData) => {
    return apiClient.put('/api/driver/profile', profileData);
  },
  updateStatus: (isOnline, location) => {
    return apiClient.post('/api/driver/status', { isOnline, location });
  },
  updateLocation: (location) => {
    return apiClient.post('/api/driver/location', { location });
  },
  getAvailableOrders: () => {
    return apiClient.get('/api/driver/orders/available');
  },
  getActiveOrders: () => {
    return apiClient.get('/api/driver/orders/active');
  },
  acceptOrder: (orderId, location) => {
    return apiClient.post(`/api/driver/orders/${orderId}/accept`, { location });
  },
  rejectOrder: (orderId) => {
    return apiClient.post(`/api/driver/orders/${orderId}/reject`);
  },
  updateOrderStatus: (orderId, status) => {
    return apiClient.post(`/api/driver/orders/${orderId}/status`, { status });
  },
  updateOrderLocation: (orderId, location) => {
    return apiClient.post(`/api/driver/orders/${orderId}/location`, { location });
  },
  getEarnings: (timeframe = 'all') => {
    return apiClient.get('/api/driver/earnings', { params: { timeframe } });
  },
  getEarningsHistory: (startDate, endDate) => {
    return apiClient.get('/api/driver/earnings/history', { params: { startDate, endDate } });
  },
  getPerformance: () => {
    return apiClient.get('/api/driver/performance');
  },
  updateSettings: (settings) => {
    return apiClient.put('/api/driver/settings', settings);
  }
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => {
    return apiClient.get('/api/admin/stats/dashboard');
  },
  getUsers: (params) => {
    return apiClient.get('/api/admin/users', { params });
  },
  createUser: (userData) => {
    return apiClient.post('/api/admin/users', userData);
  },
  updateUser: (id, userData) => {
    return apiClient.put(`/api/admin/users/${id}`, userData);
  },
  deleteUser: (id) => {
    return apiClient.delete(`/api/admin/users/${id}`);
  },
  getRestaurants: (params) => {
    return apiClient.get('/api/admin/restaurants', { params });
  },
  approveRestaurant: (id, data) => {
    return apiClient.put(`/api/admin/restaurants/${id}/approve`, data);
  },
  rejectRestaurant: (id, data) => {
    return apiClient.put(`/api/admin/restaurants/${id}/reject`, data);
  },
  getDrivers: (params) => {
    return apiClient.get('/api/admin/drivers', { params });
  },
  createDriver: (driverData) => {
    return apiClient.post('/api/admin/drivers', driverData);
  },
  updateDriver: (id, driverData) => {
    return apiClient.put(`/api/admin/drivers/${id}`, driverData);
  },
  deleteDriver: (id) => {
    return apiClient.delete(`/api/admin/drivers/${id}`);
  },
  getCategories: () => {
    return apiClient.get('/api/admin/categories');
  },
  createCategory: (categoryData) => {
    const formData = new FormData();
    for (const key in categoryData) {
      if (key === 'image' && categoryData[key] instanceof File) {
        formData.append(key, categoryData[key]);
      } else {
        formData.append(key, categoryData[key]);
      }
    }
    
    return apiClient.post('/api/admin/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateCategory: (id, categoryData) => {
    const formData = new FormData();
    for (const key in categoryData) {
      if (key === 'image' && categoryData[key] instanceof File) {
        formData.append(key, categoryData[key]);
      } else {
        formData.append(key, categoryData[key]);
      }
    }
    
    return apiClient.put(`/api/admin/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteCategory: (id) => {
    return apiClient.delete(`/api/admin/categories/${id}`);
  },
  getPromotions: (params) => {
    return apiClient.get('/api/admin/promotions', { params });
  },
  createPromotion: (promotionData) => {
    return apiClient.post('/api/admin/promotions', promotionData);
  },
  updatePromotion: (id, promotionData) => {
    return apiClient.put(`/api/admin/promotions/${id}`, promotionData);
  },
  deletePromotion: (id) => {
    return apiClient.delete(`/api/admin/promotions/${id}`);
  },
  getRestaurantCounts: () => {
    return apiClient.get('/api/admin/restaurants/counts');
  },
  getUserCounts: () => {
    return apiClient.get('/api/admin/users/counts');
  },
  createRestaurant: (restaurantData) => {
    return apiClient.post('/api/admin/restaurants', restaurantData);
  },
  updateRestaurant: (id, restaurantData) => {
    return apiClient.put(`/api/admin/restaurants/${id}`, restaurantData);
  },
  deleteRestaurant: (id) => {
    return apiClient.delete(`/api/admin/restaurants/${id}`);
  },
  getPendingOrders: () => {
    return apiClient.get('/api/admin/orders/pending');
  },
  assignOrder: (assignmentData) => {
    return apiClient.post('/api/admin/orders/assign', assignmentData);
  },
  getRestaurantVerificationData: (restaurantId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/verification`);
  },
  suspendRestaurant: (restaurantId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/suspend`, data);
  },
  activateRestaurant: (restaurantId) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/activate`);
  },
  getPendingMenuItems: (restaurantId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/menu/pending`);
  },
  getPendingCategories: (restaurantId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/categories/pending`);
  },
  approveMenuItem: (restaurantId, itemId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/approve`, data);
  },
  rejectMenuItem: (restaurantId, itemId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/reject`, data);
  },
  approveCategory: (restaurantId, categoryId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}/approve`, data);
  },
  rejectCategory: (restaurantId, categoryId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}/reject`, data);
  },
  requestDocument: (restaurantId, documentId) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/documents/${documentId}/request`);
  }
};

export default {
  auth,
  user: userAPI,
  restaurant: restaurantAPI,
  menu: menuAPI,
  order: orderAPI,
  restaurantAdmin: restaurantAdminAPI,
  driver: driverAPI,
  admin: adminAPI
};