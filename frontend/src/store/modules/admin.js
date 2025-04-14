import axios from 'axios'
import { adminWebSocket } from '@/services/adminWebSocket.service';
import { adminAPI } from '@/services/api.service'
import { WS_URL } from '@/config';

const state = {
  // Dashboard stats
  stats: {
    orders: { total: 0, growth: 0 },
    revenue: { total: 0, growth: 0 },
    users: { total: 0, growth: 0 },
    restaurants: { total: 0, growth: 0 }
  },
  restaurantStats: {
    pending: 0,
    active: 0,
    suspended: 0
  },
  userStats: {
    reported: 0,
    suspended: 0
  },
  analyticsData: {
    orderTrend: [],
    revenueTrend: [],
    userGrowth: [],
    popularCategories: [],
    topCities: [],
    orderStatusCounts: []
  },

  // Recent activities
  recentOrders: [],
  recentUsers: [],
  recentRestaurants: [],
  recentActivities: {
    orders: [],
    users: [],
    restaurants: []
  },

  // Category management
  categories: [],

  // Notifications
  notifications: [],

  // Content management
  banners: [],
  staticPages: [],
  siteConfig: null,

  // Resource management
  pendingRestaurants: 0,

  preferences: {
    notificationSound: true,
    emailNotifications: true,
    monitoredRestaurants: [],
    monitoredUsers: []
  },
  monitoredEntities: {
    restaurants: new Set(),
    users: new Set()
  },
  systemAlerts: [],

  // WebSocket
  socket: null,
  wsConnected: false,

  // State for analytics
  analytics: {
    loading: false,
    error: null,
    stats: {
      revenue: 0,
      revenueGrowth: 0,
      orders: 0,
      ordersGrowth: 0,
      restaurants: 0,
      restaurantsGrowth: 0,
      users: 0,
      usersGrowth: 0
    },
    trends: [],
    userSegments: [],
    restaurants: [],
    drivers: []
  }
}

const mutations = {
  SET_STATS(state, stats) {
    state.stats = stats
  },
  SET_RESTAURANT_STATS(state, stats) {
    state.restaurantStats = stats
  },
  SET_ANALYTICS_DATA(state, data) {
    state.analyticsData = data
  },
  SET_RECENT_ACTIVITIES(state, { orders, users, restaurants }) {
    state.recentOrders = orders
    state.recentUsers = users
    state.recentRestaurants = restaurants
  },
  ADD_NOTIFICATION(state, notification) {
    state.notifications.unshift({
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    });
  },
  MARK_NOTIFICATIONS_READ(state) {
    state.notifications = state.notifications.map(n => ({ ...n, read: true }))
  },
  SET_BANNERS(state, banners) {
    state.banners = banners
  },
  SET_STATIC_PAGES(state, pages) {
    state.staticPages = pages
  },
  SET_SITE_CONFIG(state, config) {
    state.siteConfig = config
  },
  SET_PENDING_RESTAURANTS(state, count) {
    state.pendingRestaurants = count
  },
  UPDATE_RESTAURANT_STATS(state, { type, value }) {
    if (type in state.restaurantStats) {
      state.restaurantStats[type] = value;
    }
  },
  UPDATE_USER_STATS(state, { type, value }) {
    if (type in state.userStats) {
      state.userStats[type] = value;
    }
  },
  ADD_RECENT_ACTIVITY(state, { type, activity }) {
    if (type in state.recentActivities) {
      state.recentActivities[type].unshift(activity);
      state.recentActivities[type] = state.recentActivities[type].slice(0, 10);
    }
  },
  UPDATE_PREFERENCES(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences };
  },
  ADD_MONITORED_ENTITY(state, { type, id }) {
    if (type in state.monitoredEntities) {
      state.monitoredEntities[type].add(id);
    }
  },
  REMOVE_MONITORED_ENTITY(state, { type, id }) {
    if (type in state.monitoredEntities) {
      state.monitoredEntities[type].delete(id);
    }
  },
  ADD_SYSTEM_ALERT(state, alert) {
    state.systemAlerts.unshift({
      id: Date.now(),
      timestamp: new Date(),
      ...alert
    });
  },
  CLEAR_SYSTEM_ALERT(state, alertId) {
    state.systemAlerts = state.systemAlerts.filter(alert => alert.id !== alertId);
  },
  SET_ANALYTICS_LOADING(state, loading) {
    state.analytics.loading = loading;
  },
  SET_ANALYTICS_ERROR(state, error) {
    state.analytics.error = error;
  },
  SET_ANALYTICS_DATA(state, data) {
    state.analytics = {
      ...state.analytics,
      ...data,
      loading: false,
      error: null
    };
  },
  SET_SOCKET(state, socket) {
    state.socket = socket;
  },
  SET_WS_CONNECTED(state, connected) {
    state.wsConnected = connected;
  },
  SET_ANALYTICS_STATS(state, stats) {
    state.analytics.stats = stats;
  },
  SET_ANALYTICS_TRENDS(state, trends) {
    state.analytics.trends = trends;
  },
  SET_ANALYTICS_USER_SEGMENTS(state, segments) {
    state.analytics.userSegments = segments;
  },
  SET_ANALYTICS_TOP_RESTAURANTS(state, restaurants) {
    state.analytics.restaurants = restaurants;
  },
  SET_ANALYTICS_TOP_DRIVERS(state, drivers) {
    state.analytics.drivers = drivers;
  },
  SET_CATEGORIES(state, categories) {
    // Check if categories is an array before mapping
    if (!Array.isArray(categories)) {
      console.warn('Invalid categories data received:', categories);
      state.categories = [];
      return;
    }
    
    // Map backend fields to frontend expected structure
    state.categories = categories.map(category => ({
      ...category,
      // Map isActive to active for frontend consistency
      active: category.isActive,
      // Ensure backwards compatibility
      isActive: category.isActive,
      // Set imageUrl from image if available
      imageUrl: category.image || category.imageUrl || null,
      // Set default restaurant count if not provided
      restaurantCount: category.restaurantCount || 0
    }));
  }
}

const actions = {
  async fetchDashboardData({ commit }) {
    try {
      const [statsRes, analyticsRes, activitiesRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/analytics'),
        axios.get('/api/admin/recent-activities')
      ])

      commit('SET_STATS', statsRes.data.data.stats)
      commit('SET_RESTAURANT_STATS', statsRes.data.data.restaurantStats)
      commit('SET_ANALYTICS_DATA', analyticsRes.data.data)
      commit('SET_RECENT_ACTIVITIES', activitiesRes.data.data)
      commit('SET_PENDING_RESTAURANTS', statsRes.data.data.restaurantStats.pending)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      throw error
    }
  },

  async updateRestaurantStatus({ dispatch }, { id, status, adminNotes }) {
    try {
      await axios.patch(`/api/admin/restaurants/${id}/status`, { status, adminNotes })
      dispatch('fetchDashboardData')
    } catch (error) {
      console.error('Failed to update restaurant status:', error)
      throw error
    }
  },

  async updateUserStatus({ dispatch }, { id, status }) {
    try {
      await axios.patch(`/api/admin/users/${id}/status`, { status })
      dispatch('fetchDashboardData')
    } catch (error) {
      console.error('Failed to update user status:', error)
      throw error
    }
  },

  // Content Management
  async fetchBanners({ commit }) {
    try {
      const res = await axios.get('/api/admin/banners')
      commit('SET_BANNERS', res.data)
    } catch (error) {
      console.error('Failed to fetch banners:', error)
      throw error
    }
  },

  async createBanner({ dispatch }, formData) {
    try {
      await axios.post('/api/admin/banners', formData)
      dispatch('fetchBanners')
    } catch (error) {
      console.error('Failed to create banner:', error)
      throw error
    }
  },

  async updateBanner({ dispatch }, { id, formData }) {
    try {
      await axios.put(`/api/admin/banners/${id}`, formData)
      dispatch('fetchBanners')
    } catch (error) {
      console.error('Failed to update banner:', error)
      throw error
    }
  },

  async deleteBanner({ dispatch }, id) {
    try {
      await axios.delete(`/api/admin/banners/${id}`)
      dispatch('fetchBanners')
    } catch (error) {
      console.error('Failed to delete banner:', error)
      throw error
    }
  },

  async fetchStaticPages({ commit }) {
    try {
      const res = await axios.get('/api/admin/pages')
      commit('SET_STATIC_PAGES', res.data)
    } catch (error) {
      console.error('Failed to fetch static pages:', error)
      throw error
    }
  },

  async createStaticPage({ dispatch }, pageData) {
    try {
      await axios.post('/api/admin/pages', pageData)
      dispatch('fetchStaticPages')
    } catch (error) {
      console.error('Failed to create static page:', error)
      throw error
    }
  },

  async updateStaticPage({ dispatch }, { id, pageData }) {
    try {
      await axios.put(`/api/admin/pages/${id}`, pageData)
      dispatch('fetchStaticPages')
    } catch (error) {
      console.error('Failed to update static page:', error)
      throw error
    }
  },

  async deleteStaticPage({ dispatch }, id) {
    try {
      await axios.delete(`/api/admin/pages/${id}`)
      dispatch('fetchStaticPages')
    } catch (error) {
      console.error('Failed to delete static page:', error)
      throw error
    }
  },

  async fetchSiteConfig({ commit }) {
    try {
      const res = await axios.get('/api/admin/config')
      commit('SET_SITE_CONFIG', res.data)
    } catch (error) {
      console.error('Failed to fetch site config:', error)
      throw error
    }
  },

  async updateSiteConfig({ dispatch }, configData) {
    try {
      await axios.put('/api/admin/config', configData)
      dispatch('fetchSiteConfig')
    } catch (error) {
      console.error('Failed to update site config:', error)
      throw error
    }
  },

  markNotificationsAsRead({ commit }) {
    commit('MARK_NOTIFICATIONS_READ')
  },

  initWebSocket({ commit, dispatch }) {
    try {
      // Close any existing connection
      dispatch('closeConnections');

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Cannot connect to WebSocket: No auth token');
        return;
      }

      // Get WebSocket URL from config or environment
      let wsUrl = 'ws://localhost:3000';

      console.log(`Connecting to WebSocket at: ${wsUrl}`);

      // Import and use the adminWebSocket service instead of creating a new connection
      import('@/services/adminWebSocket.service').then(module => {
        const adminWebSocket = module.default;

        // Override the baseUrl with our calculated wsUrl
        adminWebSocket.baseUrl = wsUrl.replace('ws:', 'http:').replace('wss:', 'https:');

        // Connect to the WebSocket
        adminWebSocket.connect();

        // Set up custom event handlers
        if (adminWebSocket.socket) {
          adminWebSocket.socket.on('connect', () => {
            commit('SET_SOCKET', adminWebSocket.socket);
            commit('SET_WS_CONNECTED', true);
          });

          adminWebSocket.socket.on('notification', (data) => {
            commit('ADD_NOTIFICATION', data.notification);
          });

          adminWebSocket.socket.on('system_alert', (data) => {
            commit('ADD_SYSTEM_ALERT', data.alert);
          });

          adminWebSocket.socket.on('stats_update', (data) => {
            commit('SET_STATS', data.stats);
          });
        }
      }).catch(error => {
        console.error('Failed to import adminWebSocket service:', error);
      });

      // For backward compatibility, keep the old code commented out
      /*
      try {
        // Connect to WebSocket
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('Admin WebSocket connected');
          commit('SET_SOCKET', socket);
          commit('SET_WS_CONNECTED', true);

          // Send authentication message
          socket.send(JSON.stringify({ type: 'auth', token }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Admin WebSocket message:', data);

            // Handle different message types
            switch (data.type) {
              case 'notification':
                commit('ADD_NOTIFICATION', data.notification);
                break;
              case 'system_alert':
                commit('ADD_SYSTEM_ALERT', data.alert);
                break;
              case 'stats_update':
                commit('SET_STATS', data.stats);
                break;
              default:
                console.log('Unhandled WebSocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            // Continue operation even with parsing errors
          }
        };

        socket.onerror = (error) => {
          console.error('Admin WebSocket error:', error);
          commit('SET_WS_CONNECTED', false);

          // Don't store the socket if there's an error
          if (error) {
            dispatch('closeConnections');
          }
        };

        socket.onclose = (event) => {
          console.log(`Admin WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
          commit('SET_WS_CONNECTED', false);
          commit('SET_SOCKET', null);

          // Only auto-reconnect in production or if explicitly enabled
          // For development, don't continuously try to reconnect if backend is unavailable
          if (process.env.NODE_ENV === 'production' && event.code !== 1000 && event.code !== 1001) {
            console.log('Attempting to reconnect WebSocket in 5 seconds...');
            setTimeout(() => {
              dispatch('initWebSocket');
            }, 5000);
          }
        };
      } catch (wsError) {
        console.error('WebSocket connection error:', wsError);
        commit('SET_WS_CONNECTED', false);
        commit('SET_SOCKET', null);
      }
      */

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      commit('SET_WS_CONNECTED', false);
      commit('SET_SOCKET', null);
    }
  },

  closeConnections({ commit, state }) {
    if (state.socket) {
      state.socket.close();
      commit('SET_SOCKET', null);
      commit('SET_WS_CONNECTED', false);
    }
  },

  // Restaurant monitoring
  async monitorRestaurant({ commit }, restaurantId) {
    adminWebSocket.monitorRestaurant(restaurantId);
    commit('ADD_MONITORED_ENTITY', { type: 'restaurants', id: restaurantId });
  },

  async stopMonitoringRestaurant({ commit }, restaurantId) {
    adminWebSocket.stopMonitoringRestaurant(restaurantId);
    commit('REMOVE_MONITORED_ENTITY', { type: 'restaurants', id: restaurantId });
  },

  // User monitoring
  async monitorUser({ commit }, userId) {
    adminWebSocket.monitorUser(userId);
    commit('ADD_MONITORED_ENTITY', { type: 'users', id: userId });
  },

  async stopMonitoringUser({ commit }, userId) {
    adminWebSocket.stopMonitoringUser(userId);
    commit('REMOVE_MONITORED_ENTITY', { type: 'users', id: userId });
  },

  // WebSocket event handlers
  handleNewRestaurantApplication({ commit }, data) {
    commit('ADD_NOTIFICATION', {
      type: 'RESTAURANT_APPLICATION',
      title: 'New Restaurant Application',
      message: `${data.name} has applied for registration`,
      data
    });
    commit('UPDATE_RESTAURANT_STATS', { type: 'pending', value: data.pendingCount });
    commit('ADD_RECENT_ACTIVITY', {
      type: 'restaurants',
      activity: {
        type: 'application',
        restaurantId: data.restaurantId,
        name: data.name,
        timestamp: data.timestamp
      }
    });
  },

  handleRestaurantStatusChange({ commit }, data) {
    commit('ADD_NOTIFICATION', {
      type: 'RESTAURANT_STATUS',
      title: 'Restaurant Status Changed',
      message: `Restaurant ${data.restaurantId} status changed to ${data.action}`,
      data
    });
    commit('ADD_RECENT_ACTIVITY', {
      type: 'restaurants',
      activity: {
        type: 'status_change',
        restaurantId: data.restaurantId,
        action: data.action,
        reason: data.reason,
        timestamp: data.timestamp
      }
    });
  },

  handleUserReport({ commit }, data) {
    commit('ADD_NOTIFICATION', {
      type: 'USER_REPORT',
      title: 'User Reported',
      message: `User ${data.reportedUserId} reported for ${data.reason}`,
      data
    });
    commit('UPDATE_USER_STATS', { type: 'reported', value: data.reportedCount });
    commit('ADD_RECENT_ACTIVITY', {
      type: 'users',
      activity: {
        type: 'report',
        userId: data.reportedUserId,
        reason: data.reason,
        timestamp: data.timestamp
      }
    });
  },

  handleUserStatusChange({ commit }, data) {
    commit('ADD_NOTIFICATION', {
      type: 'USER_STATUS',
      title: 'User Status Changed',
      message: `User ${data.userId} status changed to ${data.action}`,
      data
    });
    commit('ADD_RECENT_ACTIVITY', {
      type: 'users',
      activity: {
        type: 'status_change',
        userId: data.userId,
        action: data.action,
        reason: data.reason,
        timestamp: data.timestamp
      }
    });
  },

  handleOrderIssue({ commit }, data) {
    commit('ADD_NOTIFICATION', {
      type: 'ORDER_ISSUE',
      title: 'Order Issue Reported',
      message: `Issue reported for order #${data.orderId}: ${data.message}`,
      data
    });
    commit('ADD_RECENT_ACTIVITY', {
      type: 'orders',
      activity: {
        type: 'issue',
        orderId: data.orderId,
        issue: data.message,
        timestamp: data.timestamp
      }
    });
  },

  handleDeliveryIssue({ commit }, data) {
    commit('ADD_NOTIFICATION', {
      type: 'DELIVERY_ISSUE',
      title: 'Delivery Issue',
      message: `Delivery issue for order #${data.orderId}: ${data.status}`,
      data
    });
    commit('ADD_RECENT_ACTIVITY', {
      type: 'orders',
      activity: {
        type: 'delivery_issue',
        orderId: data.orderId,
        status: data.status,
        driverId: data.driverId,
        timestamp: data.timestamp
      }
    });
  },

  handleSystemAlert({ commit }, data) {
    commit('ADD_SYSTEM_ALERT', data);
    commit('ADD_NOTIFICATION', {
      type: 'SYSTEM_ALERT',
      title: 'System Alert',
      message: data.message,
      data
    });
  },

  // Restaurant actions
  async takeRestaurantAction({ commit }, { restaurantId, action, reason }) {
    adminWebSocket.restaurantAction(restaurantId, action, reason);
  },

  // User actions
  async takeUserAction({ commit }, { userId, action, reason }) {
    adminWebSocket.userAction(userId, action, reason);
  },

  // System alerts
  async emitSystemAlert({ commit }, alert) {
    adminWebSocket.emitSystemAlert(alert);
  },

  // Preferences
  updatePreferences({ commit }, preferences) {
    commit('UPDATE_PREFERENCES', preferences);
    // Save to localStorage or backend if needed
  },

  async getAnalytics({ commit }, params) {
    commit('SET_ANALYTICS_LOADING', true);
    try {
      const response = await axios.get('/api/analytics', { params });
      commit('SET_ANALYTICS_DATA', response.data.data);
      return response.data.data;
    } catch (error) {
      commit('SET_ANALYTICS_ERROR', error.response?.data?.message || 'Failed to load analytics');
      throw error;
    }
  },

  async exportAnalytics({ commit }, { format, sections, period }) {
    try {
      const response = await axios.post('/api/analytics/export', {
        format,
        sections,
        period
      }, {
        responseType: 'blob'
      });

      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Set filename based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `analytics-report-${timestamp}.${extension}`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      commit('SET_ANALYTICS_ERROR', error.response?.data?.message || 'Failed to export report');
      throw error;
    }
  },

  // User Management
  async fetchUsers({ commit }, params = {}) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.get('/api/admin/users', { params });
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to fetch users');
      throw error;
    }
  },

  async getUserDetails({ commit }, userId) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.get(`/api/admin/users/${userId}`);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data.user;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to fetch user details');
      throw error;
    }
  },

  async createUser({ commit }, userData) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.post('/api/admin/users', userData);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to create user');
      throw error;
    }
  },

  async updateUser({ commit }, { id, userData }) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.put(`/api/admin/users/${id}`, userData);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to update user');
      throw error;
    }
  },

  async updateUserStatus({ commit }, { id, status }) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.patch(`/api/admin/users/${id}/status`, { status });
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to update user status');
      throw error;
    }
  },

  async deleteUser({ commit }, id) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.delete(`/api/admin/users/${id}`);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to delete user');
      throw error;
    }
  },

  async exportUsers({ commit }, filters) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.post('/api/admin/users/export', filters);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to export users');
      throw error;
    }
  },

  // Product Management
  async fetchProducts({ commit }, params = {}) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      // Set default values for pagination
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        ...params
      };
      
      const response = await axios.get('/api/admin/products', { params: queryParams });
      commit('SET_ANALYTICS_LOADING', false);
      
      // Handle different response formats
      let items = [];
      let total = 0;
      
      if (response.data && response.data.data) {
        // Format: { data: { items: [], total: 0 } }
        if (response.data.data.items && Array.isArray(response.data.data.items)) {
          items = response.data.data.items;
          total = response.data.data.total || items.length;
        } 
        // Format: { data: [] }
        else if (Array.isArray(response.data.data)) {
          items = response.data.data;
          total = items.length;
        }
      } 
      // Format: { items: [], total: 0 }
      else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        items = response.data.items;
        total = response.data.total || items.length;
      }
      // Format: []
      else if (Array.isArray(response.data)) {
        items = response.data;
        total = items.length;
      } else {
        console.warn('Unexpected products response format:', response.data);
      }
      
      return { items, total };
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to fetch products');
      console.error('Failed to fetch products:', error);
      // Return fallback data for error case
      return { items: [], total: 0 };
    }
  },

  async getProductById({ commit }, productId) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.get(`/api/admin/products/${productId}`);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data.data.product;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to fetch product details');
      throw error;
    }
  },

  async createProduct({ commit }, productData) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      // Handle file uploads if present
      if (productData.imageFile) {
        // Handle case where imageFile might be an array from v-file-input
        const fileToUpload = Array.isArray(productData.imageFile) 
          ? productData.imageFile[0] 
          : productData.imageFile;
        
        // Only proceed with upload if it's a valid Blob
        if (fileToUpload instanceof Blob) {
          const formData = new FormData();
          formData.append('image', fileToUpload);
          
          try {
            // Upload the image first
            const uploadResponse = await axios.post('/api/upload/image', formData);
            // Replace the file with the URL
            productData.image = uploadResponse.data.imageUrl;
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            // Continue with product creation even if image upload fails
          }
        } else {
          console.warn('Invalid image file:', fileToUpload);
        }
        
        // Always remove the imageFile property as it can't be sent directly
        delete productData.imageFile;
      }
      
      const response = await axios.post('/api/admin/products', productData);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to create product');
      throw error;
    }
  },

  async updateProduct({ commit }, { id, productData }) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      
      // Handle file uploads if present
      if (productData.imageFile) {
        // Handle case where imageFile might be an array from v-file-input
        const fileToUpload = Array.isArray(productData.imageFile) 
          ? productData.imageFile[0] 
          : productData.imageFile;
        
        // Only proceed with upload if it's a valid Blob
        if (fileToUpload instanceof Blob) {
          const formData = new FormData();
          formData.append('image', fileToUpload);
          
          try {
            // Upload the image first
            const uploadResponse = await axios.post('/api/upload/image', formData);
            // Replace the file with the URL
            productData.image = uploadResponse.data.imageUrl;
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            // Continue with product update even if image upload fails
          }
        } else {
          console.warn('Invalid image file:', fileToUpload);
        }
        
        // Always remove the imageFile property as it can't be sent directly
        delete productData.imageFile;
      }
      
      const response = await axios.put(`/api/admin/products/${id}`, productData);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to update product');
      throw error;
    }
  },

  async updateProductAvailability({ commit }, { id, isAvailable }) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.patch(`/api/admin/products/${id}/availability`, { isAvailable });
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to update product availability');
      throw error;
    }
  },

  async deleteProduct({ commit }, id) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.delete(`/api/admin/products/${id}`);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to delete product');
      throw error;
    }
  },

  // Category Management
  async createCategory({ commit }, formData) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.post('/api/menu/categories', formData);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to create category');
      throw error;
    }
  },

  async updateCategory({ commit }, { id, data }) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.patch(`/api/menu/categories/${id}`, data);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to update category');
      throw error;
    }
  },

  async deleteCategory({ commit }, id) {
    try {
      commit('SET_ANALYTICS_LOADING', true);
      const response = await axios.delete(`/api/menu/categories/${id}`);
      commit('SET_ANALYTICS_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_ANALYTICS_LOADING', false);
      commit('SET_ANALYTICS_ERROR', error.message || 'Failed to delete category');
      throw error;
    }
  },

  async fetchCategories({ commit }) {
    try {
      const response = await axios.get('/api/menu/categories');
      
      // Debug the response structure
      console.log('Categories API Response:', JSON.stringify(response.data, null, 2));
      
      // Handle different possible response formats
      let categoryData;
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Format: { data: [...] }
        categoryData = response.data.data;
      } else if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
        // Format: { categories: [...] }
        categoryData = response.data.categories;
      } else if (Array.isArray(response.data)) {
        // Format: [...]
        categoryData = response.data;
      } else {
        console.warn('Unexpected categories response format:', response.data);
        // Return fallback data
        categoryData = [
          { id: 1, name: 'Uncategorized' }
        ];
      }
      
      commit('SET_CATEGORIES', categoryData);
      // Return a standardized format with data array property
      return { data: categoryData };
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Return fallback data for error case
      return { data: [{ id: 1, name: 'Uncategorized' }] };
    }
  },

  async fetchRestaurants({ commit }, params = {}) {
    try {
      // Use the generic /api/restaurants endpoint instead of the admin-specific one
      const response = await axios.get('/api/restaurants', { params });
      
      // Debug the response structure
      console.log('Restaurants API Response:', JSON.stringify(response.data, null, 2));
      
      // Handle different possible response formats
      let restaurantsData;
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Format: { data: [...] }
        restaurantsData = response.data.data;
      } else if (response.data && response.data.restaurants && Array.isArray(response.data.restaurants)) {
        // Format: { restaurants: [...] }
        restaurantsData = response.data.restaurants;
      } else if (Array.isArray(response.data)) {
        // Format: [...]
        restaurantsData = response.data;
      } else {
        console.warn('Unexpected restaurants response format:', response.data);
        // Return fallback data
        restaurantsData = [
          { id: 1, name: 'Default Restaurant' }
        ];
      }
      
      // Return a standardized format with data array property
      return { data: restaurantsData };
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      // Return fallback data for error case
      return { data: [{ id: 1, name: 'Default Restaurant' }] };
    }
  }
}

const getters = {
  unreadNotifications: state => state.notifications.filter(n => !n.read),
  pendingRestaurantsCount: state => state.restaurantStats.pending,
  notificationCount: state => state.notifications.length,
  unreadNotificationCount: (_, getters) => getters.unreadNotifications.length,

  activeSystemAlerts: state => state.systemAlerts.filter(alert => !alert.resolved),
  systemAlertCount: (_, getters) => getters.activeSystemAlerts.length,

  isMonitoringRestaurant: state => restaurantId => state.monitoredEntities.restaurants.has(restaurantId),
  isMonitoringUser: state => userId => state.monitoredEntities.users.has(userId),

  recentOrderActivities: state => state.recentActivities.orders,
  recentUserActivities: state => state.recentActivities.users,
  recentRestaurantActivities: state => state.recentActivities.restaurants,
  dashboardStats: state => state.stats,
  restaurantStats: state => state.restaurantStats,
  userStats: state => state.userStats,
  analyticsData: state => state.analyticsData,
  recentOrders: state => state.recentOrders,
  recentUsers: state => state.recentUsers,
  recentRestaurants: state => state.recentRestaurants,
  notifications: state => state.notifications,
  wsConnected: state => state.wsConnected,
  isAnalyticsLoading: state => state.analytics.loading,
  analyticsError: state => state.analytics.error,
  analyticsStats: state => state.analytics.stats,
  categories: state => state.categories
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
