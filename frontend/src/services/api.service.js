import axios from 'axios';
import store from '../store';
import router from '../router';
import { API_URL } from '../config';

// Create axios instance
const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// For backward compatibility
export const apiClient = apiService;

// Request interceptor to ensure all requests have /api prefix
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiService.interceptors.request.use(
  config => {
    // Try to get token from localStorage first, then fallback to store
    const token = localStorage.getItem('token') || store.getters['auth/token'];
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // CSRF protection
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    // Security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-Frame-Options'] = 'DENY';

    console.debug(`API Request: ${config.method} ${config.url}`);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiService.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post('http://localhost:3000/api/auth/refresh-token', { refreshToken });
        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens in localStorage and store
        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        // Update store
        await store.commit('auth/SET_ACCESS_TOKEN', newAccessToken);
        if (newRefreshToken) {
          await store.commit('auth/SET_REFRESH_TOKEN', newRefreshToken);
        }

        // Retry the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiService(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear auth and redirect to login
        store.commit('auth/CLEAR_AUTH');
        router.push('/login');
        return Promise.reject(error);
      }
    }

    // Standard error handling
    if (error.response) {
      switch (error.response.status) {
        case 403:
          store.dispatch('ui/showSnackbar', {
            text: 'You don\'t have permission to perform this action',
            color: 'error'
          });
          break;

        case 404:
          if (originalRequest.url.includes('/restaurants/')) {
            store.dispatch('ui/showSnackbar', {
              text: 'Restaurant not found',
              color: 'error'
            });
          }
          break;

        case 429:
          store.dispatch('ui/showSnackbar', {
            text: 'Too many requests. Please try again later.',
            color: 'error'
          });
          break;

        case 500:
          store.dispatch('ui/showSnackbar', {
            text: 'Server error. Please try again later.',
            color: 'error'
          });
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      store.dispatch('ui/showSnackbar', {
        text: 'Request timed out. Please try again.',
        color: 'error'
      });
    } else if (error.message === 'Network Error') {
      store.dispatch('ui/showSnackbar', {
        text: 'Network error. Please check your internet connection.',
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
    return apiService.post('/api/auth/register', userData);
  },

  // Login with email and password
  login: (email, password) => {
    return apiService.post('/api/auth/login', { email, password });
  },

  // Request password reset
  requestPasswordReset: (email) => {
    return apiService.post('/api/auth/password/request-reset', { email });
  },

  // Reset password with token
  resetPassword: (token, newPassword) => {
    return apiService.post('/api/auth/password/reset', { token, newPassword });
  },

  // Request phone verification code
  requestPhoneVerification: (phone) => {
    return apiService.post('/api/auth/phone/request', { phone });
  },

  // Verify phone code
  verifyPhoneCode: (phone, code) => {
    return apiService.post('/api/auth/phone/verify', { phone, code });
  },

  // Social login
  socialLogin: (provider, data) => {
    return apiService.post('/api/auth/social', {
      provider,
      providerId: data.userId || data.sub,
      email: data.email,
      name: data.name,
      avatar: data.picture
    });
  },

  // Google login
  loginWithGoogle: (idToken) => {
    return apiService.post('/api/auth/login/google', { idToken });
  },

  // Facebook login
  loginWithFacebook: (accessToken) => {
    return apiService.post('/api/auth/login/facebook', { accessToken });
  },

  logout: () => apiService.post('/api/auth/logout'),

  refreshToken: (refreshToken) => apiService.post('/api/auth/refresh-token', { refreshToken }),

  getProfile: () => apiService.get('/api/auth/profile')
};

// User API
export const userAPI = {
  getProfile: () => {
    return apiService.get('/api/user/profile');
  },
  updateProfile: (userData) => {
    return apiService.put('/api/user/profile', userData);
  },
  getAddresses: () => {
    return apiService.get('/api/user/addresses');
  },
  addAddress: (addressData) => {
    return apiService.post('/api/user/addresses', addressData);
  },
  updateAddress: (id, addressData) => {
    return apiService.put(`/api/user/addresses/${id}`, addressData);
  },
  deleteAddress: (id) => {
    return apiService.delete(`/api/user/addresses/${id}`);
  },
  setDefaultAddress: (id) => {
    return apiService.put(`/api/user/addresses/${id}/default`);
  }
};

// Restaurant API
export const restaurantAPI = {
  getAllRestaurants: (params) => {
    return apiService.get('/api/restaurants', { params });
  },
  getFeaturedRestaurants: (limit = 5) => {
    return apiService.get('/api/restaurants/featured', { params: { limit } });
  },
  getNearbyRestaurants: (lat, lng, radius, limit) => {
    return apiService.get('/api/restaurants/nearby', { params: { lat, lng, radius, limit } });
  },
  getRestaurantById: (id) => {
    return apiService.get(`/api/restaurants/${id}`);
  },
  getRestaurantMenu: (id, categoryId) => {
    return apiService.get(`/api/restaurants/${id}/menu`, { params: { categoryId } });
  },
  getRestaurantReviews: (id, page = 1, limit = 10) => {
    return apiService.get(`/api/restaurants/${id}/reviews`, { params: { page, limit } });
  },
  createRestaurant: (restaurantData) => {
    // Check if it's FormData or regular object
    const isFormData = restaurantData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    // We'll try different endpoints in sequence if needed
    return new Promise(async (resolve, reject) => {
      try {
        // First try the standard restaurant route
        console.log('Attempting to create restaurant with /api/restaurants');
        const response = await apiService.post('/api/restaurants', restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error('Failed with /api/restaurants:', error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log('Attempting to create restaurant with /api/restaurant-admin/restaurants');
          const response = await apiService.post('/api/restaurant-admin/restaurants', restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error('Failed with /api/restaurant-admin/restaurants:', error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log('Attempting to create restaurant with /api/admin/restaurants');
            const response = await apiService.post('/api/admin/restaurants', restaurantData, { headers });
            resolve(response);
          } catch (error3) {
            console.error('Failed with /api/admin/restaurants:', error3);
            console.error('All restaurant creation endpoints failed');
            reject(error3);
          }
        }
      }
    });
  },
  updateRestaurant: (id, restaurantData) => {
    // Check if it's FormData or regular object
    const isFormData = restaurantData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    // We'll try different endpoints in sequence if needed
    return new Promise(async (resolve, reject) => {
      try {
        // First try the standard restaurant route
        console.log(`Attempting to update restaurant with /api/restaurants/${id}`);
        const response = await apiService.put(`/api/restaurants/${id}`, restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error(`Failed with /api/restaurants/${id}:`, error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log(`Attempting to update restaurant with /api/restaurant-admin/restaurants/${id}`);
          const response = await apiService.put(`/api/restaurant-admin/restaurants/${id}`, restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error(`Failed with /api/restaurant-admin/restaurants/${id}:`, error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log(`Attempting to update restaurant with /api/admin/restaurants/${id}`);
            const response = await apiService.put(`/api/admin/restaurants/${id}`, restaurantData, { headers });
            resolve(response);
          } catch (error3) {
            console.error(`Failed with /api/admin/restaurants/${id}:`, error3);
            console.error('All restaurant update endpoints failed');
            reject(error3);
          }
        }
      }
    });
  },
  deleteRestaurant: (id) => {
    return apiService.delete(`/api/restaurants/${id}`);
  },
  toggleOpenStatus: (id, isOpen) => {
    return apiService.put(`/api/restaurants/${id}/status`, { isOpen });
  },
  replyToReview: (restaurantId, reviewId, reply) => {
    return apiService.post(`/api/restaurants/${restaurantId}/reviews/${reviewId}/reply`, { reply });
  }
};

// Menu API (for restaurant admin)
export const menuAPI = {
  getMenuItems: (restaurantId) => {
    return apiService.get(`/api/restaurants/${restaurantId}/menu`);
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

    return apiService.post(`/api/restaurants/${restaurantId}/menu`, formData, {
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

    return apiService.put(`/api/restaurants/${restaurantId}/menu/${itemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteMenuItem: (restaurantId, itemId) => {
    return apiService.delete(`/api/restaurants/${restaurantId}/menu/${itemId}`);
  },
  toggleItemAvailability: (restaurantId, itemId, isAvailable) => {
    return apiService.put(`/api/restaurants/${restaurantId}/menu/${itemId}/availability`, {
      isAvailable
    });
  },
  createMenuCategory: (restaurantId, categoryData) => {
    return apiService.post(`/api/restaurants/${restaurantId}/menu-categories`, categoryData);
  },
  updateMenuCategory: (restaurantId, categoryId, categoryData) => {
    return apiService.put(`/api/restaurants/${restaurantId}/menu-categories/${categoryId}`, categoryData);
  },
  deleteMenuCategory: (restaurantId, categoryId) => {
    return apiService.delete(`/api/restaurants/${restaurantId}/menu-categories/${categoryId}`);
  }
};

// Order API
export const orderAPI = {
  createOrder: (orderData) => {
    return apiService.post('/api/orders', orderData);
  },
  getUserOrders: (params) => {
    return apiService.get('/api/orders', { params });
  },
  getOrderById: (id) => {
    return apiService.get(`/api/orders/${id}`);
  },
  getOrderByNumber: (orderNumber) => {
    return apiService.get(`/api/orders/number/${orderNumber}`);
  },
  trackOrder: (id) => {
    return apiService.get(`/api/orders/${id}/track`);
  },
  updateOrderStatus: (id, status) => {
    return apiService.put(`/api/orders/${id}/status`, { status });
  },
  cancelOrder: (id, reason) => {
    return apiService.post(`/api/orders/${id}/cancel`, { reason });
  },
  addOrderReview: (id, reviewData) => {
    return apiService.post(`/api/orders/${id}/review`, reviewData);
  },
  reorder: (id, orderData) => {
    return apiService.post(`/api/orders/${id}/reorder`, orderData);
  }
};

// Restaurant Admin API
export const restaurantAdminAPI = {
  getDashboard: (restaurantId) => {
    return apiService.get(`/api/restaurant-admin/dashboard/${restaurantId}`);
  },
  getOrders: (restaurantId, params) => {
    return apiService.get(`/api/restaurant-admin/restaurants/${restaurantId}/orders`, { params });
  },
  getAnalytics: (restaurantId, timeframe = 'month') => {
    return apiService.get(`/api/restaurant-admin/restaurants/${restaurantId}/analytics`, {
      params: { timeframe }
    });
  },
  createPromotion: (restaurantId, promotionData) => {
    return apiService.post(`/api/restaurant-admin/restaurants/${restaurantId}/promotions`, promotionData);
  },
  updatePromotion: (restaurantId, promotionId, promotionData) => {
    return apiService.put(`/api/restaurant-admin/restaurants/${restaurantId}/promotions/${promotionId}`, promotionData);
  },
  deletePromotion: (restaurantId, promotionId) => {
    return apiService.delete(`/api/restaurant-admin/restaurants/${restaurantId}/promotions/${promotionId}`);
  },
  getPromotions: (restaurantId) => {
    return apiService.get(`/api/restaurant-admin/restaurants/${restaurantId}/promotions`);
  },
  getSettings: (restaurantId) => {
    return apiService.get(`/api/restaurant-admin/restaurants/${restaurantId}/settings`);
  },
  updateSettings: (restaurantId, settingsData) => {
    return apiService.put(`/api/restaurant-admin/restaurants/${restaurantId}/settings`, settingsData);
  }
};

// Driver API
export const driverAPI = {
  getProfile: () => {
    return apiService.get('/api/driver/profile');
  },
  updateProfile: (profileData) => {
    return apiService.put('/api/driver/profile', profileData);
  },
  updateStatus: (isOnline, location) => {
    return apiService.post('/api/driver/status', { isOnline, location });
  },
  updateLocation: (location) => {
    return apiService.post('/api/driver/location', { location });
  },
  getAvailableOrders: () => {
    return apiService.get('/api/driver/orders/available');
  },
  getActiveOrders: () => {
    return apiService.get('/api/driver/orders/active');
  },
  acceptOrder: (orderId, location) => {
    return apiService.post(`/api/driver/orders/${orderId}/accept`, { location });
  },
  rejectOrder: (orderId) => {
    return apiService.post(`/api/driver/orders/${orderId}/reject`);
  },
  updateOrderStatus: (orderId, status) => {
    return apiService.post(`/api/driver/orders/${orderId}/status`, { status });
  },
  updateOrderLocation: (orderId, location) => {
    return apiService.post(`/api/driver/orders/${orderId}/location`, { location });
  },
  getEarnings: (timeframe = 'all') => {
    return apiService.get('/api/driver/earnings', { params: { timeframe } });
  },
  getEarningsHistory: (startDate, endDate) => {
    return apiService.get('/api/driver/earnings/history', { params: { startDate, endDate } });
  },
  getPerformance: () => {
    return apiService.get('/api/driver/performance');
  },
  updateSettings: (settings) => {
    return apiService.put('/api/driver/settings', settings);
  }
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => {
    return apiService.get('/api/admin/stats/dashboard');
  },
  getUsers: (params) => {
    return apiService.get('/api/admin/users', { params });
  },
  createUser: (userData) => {
    return apiService.post('/api/admin/users', userData);
  },
  updateUser: (id, userData) => {
    return apiService.put(`/api/admin/users/${id}`, userData);
  },
  deleteUser: (id) => {
    return apiService.delete(`/api/admin/users/${id}`);
  },
  getRestaurants: (params) => {
    return apiService.get('/api/restaurants', { params });
  },
  getRestaurantById: (id) => {
    return apiService.get(`/api/restaurants/${id}`);
  },
  approveRestaurant: (id, data) => {
    // Fallback to regular update if dedicated approve endpoint isn't available
    return apiService.put(`/api/restaurants/${id}`, { ...data, status: 'active' });
  },
  rejectRestaurant: (id, data) => {
    // Fallback to regular update if dedicated reject endpoint isn't available
    return apiService.put(`/api/restaurants/${id}`, { ...data, status: 'rejected' });
  },
  
  // Enhanced Restaurant Management
  getRestaurantOperatingHours: (restaurantId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/operating-hours`);
  },
  updateRestaurantOperatingHours: (restaurantId, hoursData) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/operating-hours`, hoursData);
  },
  getRestaurantDeliveryZones: (restaurantId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/delivery-zones`);
  },
  updateRestaurantDeliveryZones: (restaurantId, zonesData) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/delivery-zones`, zonesData);
  },
  
  // Enhanced Menu Management
  getMenuItemOptions: (restaurantId, itemId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/options`);
  },
  updateMenuItemOptions: (restaurantId, itemId, optionsData) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/options`, optionsData);
  },
  getMenuItemVariants: (restaurantId, itemId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/variants`);
  },
  updateMenuItemVariants: (restaurantId, itemId, variantsData) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/variants`, variantsData);
  },
  
  // Enhanced Order Management
  getOrdersStatistics: (dateRange) => {
    return apiService.get('/api/admin/orders/statistics', { params: dateRange });
  },
  getOrderLogs: (orderId) => {
    return apiService.get(`/api/admin/orders/${orderId}/logs`);
  },

  // Existing endpoints
  getRestaurantMenu: (restaurantId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/menu`);
  },
  getRestaurantOrders: (restaurantId, params) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/orders`, { params });
  },
  getRestaurantReviews: (restaurantId, params) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/reviews`, { params });
  },
  replyToReview: (restaurantId, reviewId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/reviews/${reviewId}/reply`, data);
  },
  updateReviewReply: (restaurantId, reviewId, data) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/reviews/${reviewId}/reply`, data);
  },
  reportReview: (restaurantId, reviewId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/reviews/${reviewId}/report`, data);
  },
  createMenuCategory: (restaurantId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/categories`, data);
  },
  updateMenuCategory: (restaurantId, categoryId, data) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}`, data);
  },
  deleteMenuCategory: (restaurantId, categoryId) => {
    return apiService.delete(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}`);
  },
  createMenuItem: (restaurantId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/menu`, data);
  },
  updateMenuItem: (restaurantId, itemId, data) => {
    return apiService.put(`/api/admin/restaurants/${restaurantId}/menu/${itemId}`, data);
  },
  deleteMenuItem: (restaurantId, itemId) => {
    return apiService.delete(`/api/admin/restaurants/${restaurantId}/menu/${itemId}`);
  },
  updateOrderStatus: (orderId, data) => {
    return apiService.put(`/api/admin/orders/${orderId}/status`, data);
  },
  getDrivers: (params) => {
    return apiService.get('/api/admin/drivers', { params });
  },
  createDriver: (driverData) => {
    return apiService.post('/api/admin/drivers', driverData);
  },
  updateDriver: (id, driverData) => {
    return apiService.put(`/api/admin/drivers/${id}`, driverData);
  },
  deleteDriver: (id) => {
    return apiService.delete(`/api/admin/drivers/${id}`);
  },
  getCategories: () => {
    return apiService.get('/api/admin/categories');
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

    return apiService.post('/api/admin/categories', formData, {
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

    return apiService.put(`/api/admin/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteCategory: (id) => {
    return apiService.delete(`/api/admin/categories/${id}`);
  },
  getPromotions: (params) => {
    return apiService.get('/api/admin/promotions', { params });
  },
  createPromotion: (promotionData) => {
    return apiService.post('/api/admin/promotions', promotionData);
  },
  updatePromotion: (id, promotionData) => {
    return apiService.put(`/api/admin/promotions/${id}`, promotionData);
  },
  deletePromotion: (id) => {
    return apiService.delete(`/api/admin/promotions/${id}`);
  },
  getRestaurantCounts: () => {
    return apiService.get('/api/admin/restaurants/counts');
  },
  getUserCounts: () => {
    return apiService.get('/api/admin/users/counts');
  },
  createRestaurant: (restaurantData) => {
    // Check if it's FormData or regular object
    const isFormData = restaurantData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    // We'll try different endpoints in sequence if needed
    return new Promise(async (resolve, reject) => {
      try {
        // First try the standard restaurant route
        console.log('Attempting to create restaurant with /api/restaurants');
        const response = await apiService.post('/api/restaurants', restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error('Failed with /api/restaurants:', error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log('Attempting to create restaurant with /api/restaurant-admin/restaurants');
          const response = await apiService.post('/api/restaurant-admin/restaurants', restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error('Failed with /api/restaurant-admin/restaurants:', error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log('Attempting to create restaurant with /api/admin/restaurants');
            const response = await apiService.post('/api/admin/restaurants', restaurantData, { headers });
            resolve(response);
          } catch (error3) {
            console.error('Failed with /api/admin/restaurants:', error3);
            console.error('All restaurant creation endpoints failed');
            reject(error3);
          }
        }
      }
    });
  },
  updateRestaurant: (id, restaurantData) => {
    // Check if it's FormData or regular object
    const isFormData = restaurantData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    // We'll try different endpoints in sequence if needed
    return new Promise(async (resolve, reject) => {
      try {
        // First try the standard restaurant route
        console.log(`Attempting to update restaurant with /api/restaurants/${id}`);
        const response = await apiService.put(`/api/restaurants/${id}`, restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error(`Failed with /api/restaurants/${id}:`, error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log(`Attempting to update restaurant with /api/restaurant-admin/restaurants/${id}`);
          const response = await apiService.put(`/api/restaurant-admin/restaurants/${id}`, restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error(`Failed with /api/restaurant-admin/restaurants/${id}:`, error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log(`Attempting to update restaurant with /api/admin/restaurants/${id}`);
            const response = await apiService.put(`/api/admin/restaurants/${id}`, restaurantData, { headers });
            resolve(response);
          } catch (error3) {
            console.error(`Failed with /api/admin/restaurants/${id}:`, error3);
            console.error('All restaurant update endpoints failed');
            reject(error3);
          }
        }
      }
    });
  },
  deleteRestaurant: (id) => {
    return apiService.delete(`/api/restaurants/${id}`);
  },
  getPendingOrders: () => {
    return apiService.get('/api/admin/orders/pending');
  },
  assignOrder: (assignmentData) => {
    return apiService.post('/api/admin/orders/assign', assignmentData);
  },
  getRestaurantVerificationData: (restaurantId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/verification`);
  },
  suspendRestaurant: (restaurantId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/suspend`, data);
  },
  activateRestaurant: (restaurantId) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/activate`);
  },
  getPendingMenuItems: (restaurantId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/menu/pending`);
  },
  getPendingCategories: (restaurantId) => {
    return apiService.get(`/api/admin/restaurants/${restaurantId}/categories/pending`);
  },
  approveMenuItem: (restaurantId, itemId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/approve`, data);
  },
  rejectMenuItem: (restaurantId, itemId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/reject`, data);
  },
  approveCategory: (restaurantId, categoryId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}/approve`, data);
  },
  rejectCategory: (restaurantId, categoryId, data) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}/reject`, data);
  },
  requestDocument: (restaurantId, documentId) => {
    return apiService.post(`/api/admin/restaurants/${restaurantId}/documents/${documentId}/request`);
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