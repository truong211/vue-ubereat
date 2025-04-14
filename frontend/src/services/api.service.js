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

apiClient.interceptors.request.use(
  config => {
    // Only attach Authorization header if the request isn't for token refresh
    if (!config.url.includes('/auth/refresh')) {
      const token = document.cookie.split('; ').find(row => row.startsWith('jwt='));
      if (token) {
        config.headers['Authorization'] = `Bearer ${token.split('=')[1]}`;
      }
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
  error => Promise.reject(error)
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await store.dispatch('auth/refreshToken');
        const { token } = response;

        if (token) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          processQueue(null, token);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state and redirect to login
        await store.dispatch('auth/logout');
        router.push('/auth/login');
        store.dispatch('ui/showSnackbar', {
          text: 'Your session has expired. Please log in again.',
          color: 'error'
        });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
    // Check if it's FormData or regular object
    const isFormData = restaurantData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    // We'll try different endpoints in sequence if needed
    return new Promise(async (resolve, reject) => {
      try {
        // First try the standard restaurant route
        console.log('Attempting to create restaurant with /api/restaurants');
        const response = await apiClient.post('/api/restaurants', restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error('Failed with /api/restaurants:', error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log('Attempting to create restaurant with /api/restaurant-admin/restaurants');
          const response = await apiClient.post('/api/restaurant-admin/restaurants', restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error('Failed with /api/restaurant-admin/restaurants:', error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log('Attempting to create restaurant with /api/admin/restaurants');
            const response = await apiClient.post('/api/admin/restaurants', restaurantData, { headers });
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
        const response = await apiClient.put(`/api/restaurants/${id}`, restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error(`Failed with /api/restaurants/${id}:`, error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log(`Attempting to update restaurant with /api/restaurant-admin/restaurants/${id}`);
          const response = await apiClient.put(`/api/restaurant-admin/restaurants/${id}`, restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error(`Failed with /api/restaurant-admin/restaurants/${id}:`, error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log(`Attempting to update restaurant with /api/admin/restaurants/${id}`);
            const response = await apiClient.put(`/api/admin/restaurants/${id}`, restaurantData, { headers });
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
    return apiClient.get('/api/restaurants', { params });
  },
  getRestaurantById: (id) => {
    return apiClient.get(`/api/restaurants/${id}`);
  },
  approveRestaurant: (id, data) => {
    // Fallback to regular update if dedicated approve endpoint isn't available
    return apiClient.put(`/api/restaurants/${id}`, { ...data, status: 'active' });
  },
  rejectRestaurant: (id, data) => {
    // Fallback to regular update if dedicated reject endpoint isn't available
    return apiClient.put(`/api/restaurants/${id}`, { ...data, status: 'rejected' });
  },
  
  // Enhanced Restaurant Management
  getRestaurantOperatingHours: (restaurantId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/operating-hours`);
  },
  updateRestaurantOperatingHours: (restaurantId, hoursData) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/operating-hours`, hoursData);
  },
  getRestaurantDeliveryZones: (restaurantId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/delivery-zones`);
  },
  updateRestaurantDeliveryZones: (restaurantId, zonesData) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/delivery-zones`, zonesData);
  },
  
  // Enhanced Menu Management
  getMenuItemOptions: (restaurantId, itemId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/options`);
  },
  updateMenuItemOptions: (restaurantId, itemId, optionsData) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/options`, optionsData);
  },
  getMenuItemVariants: (restaurantId, itemId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/variants`);
  },
  updateMenuItemVariants: (restaurantId, itemId, variantsData) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/menu/${itemId}/variants`, variantsData);
  },
  
  // Enhanced Order Management
  getOrdersStatistics: (dateRange) => {
    return apiClient.get('/api/admin/orders/statistics', { params: dateRange });
  },
  getOrderLogs: (orderId) => {
    return apiClient.get(`/api/admin/orders/${orderId}/logs`);
  },

  // Existing endpoints
  getRestaurantMenu: (restaurantId) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/menu`);
  },
  getRestaurantOrders: (restaurantId, params) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/orders`, { params });
  },
  getRestaurantReviews: (restaurantId, params) => {
    return apiClient.get(`/api/admin/restaurants/${restaurantId}/reviews`, { params });
  },
  replyToReview: (restaurantId, reviewId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/reviews/${reviewId}/reply`, data);
  },
  updateReviewReply: (restaurantId, reviewId, data) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/reviews/${reviewId}/reply`, data);
  },
  reportReview: (restaurantId, reviewId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/reviews/${reviewId}/report`, data);
  },
  createMenuCategory: (restaurantId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/categories`, data);
  },
  updateMenuCategory: (restaurantId, categoryId, data) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}`, data);
  },
  deleteMenuCategory: (restaurantId, categoryId) => {
    return apiClient.delete(`/api/admin/restaurants/${restaurantId}/categories/${categoryId}`);
  },
  createMenuItem: (restaurantId, data) => {
    return apiClient.post(`/api/admin/restaurants/${restaurantId}/menu`, data);
  },
  updateMenuItem: (restaurantId, itemId, data) => {
    return apiClient.put(`/api/admin/restaurants/${restaurantId}/menu/${itemId}`, data);
  },
  deleteMenuItem: (restaurantId, itemId) => {
    return apiClient.delete(`/api/admin/restaurants/${restaurantId}/menu/${itemId}`);
  },
  updateOrderStatus: (orderId, data) => {
    return apiClient.put(`/api/admin/orders/${orderId}/status`, data);
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
    // Check if it's FormData or regular object
    const isFormData = restaurantData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    // We'll try different endpoints in sequence if needed
    return new Promise(async (resolve, reject) => {
      try {
        // First try the standard restaurant route
        console.log('Attempting to create restaurant with /api/restaurants');
        const response = await apiClient.post('/api/restaurants', restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error('Failed with /api/restaurants:', error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log('Attempting to create restaurant with /api/restaurant-admin/restaurants');
          const response = await apiClient.post('/api/restaurant-admin/restaurants', restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error('Failed with /api/restaurant-admin/restaurants:', error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log('Attempting to create restaurant with /api/admin/restaurants');
            const response = await apiClient.post('/api/admin/restaurants', restaurantData, { headers });
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
        const response = await apiClient.put(`/api/restaurants/${id}`, restaurantData, { headers });
        resolve(response);
      } catch (error1) {
        console.error(`Failed with /api/restaurants/${id}:`, error1);
        
        try {
          // Try the restaurant-admin route if the first one fails
          console.log(`Attempting to update restaurant with /api/restaurant-admin/restaurants/${id}`);
          const response = await apiClient.put(`/api/restaurant-admin/restaurants/${id}`, restaurantData, { headers });
          resolve(response);
        } catch (error2) {
          console.error(`Failed with /api/restaurant-admin/restaurants/${id}:`, error2);
          
          try {
            // Try the admin/restaurants route if the second one fails 
            console.log(`Attempting to update restaurant with /api/admin/restaurants/${id}`);
            const response = await apiClient.put(`/api/admin/restaurants/${id}`, restaurantData, { headers });
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
    return apiClient.delete(`/api/restaurants/${id}`);
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