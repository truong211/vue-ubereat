import axios from 'axios'
import { adminWebSocket } from '@/services/adminWebSocket.service';
import { adminAPI } from '@/services/api.service'

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
    topCities: []
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

  initWebSocket({ commit, state }) {
    adminWebSocket.connect();
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
  recentRestaurantActivities: state => state.recentActivities.restaurants
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export const adminModule = {
  namespaced: true,

  state: {
    restaurants: [],
    restaurantCounts: {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0
    },
    loading: false,
    error: null
  },

  mutations: {
    SET_RESTAURANTS(state, restaurants) {
      state.restaurants = restaurants
    },
    SET_RESTAURANT_COUNTS(state, counts) {
      state.restaurantCounts = counts
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    UPDATE_RESTAURANT(state, updatedRestaurant) {
      const index = state.restaurants.findIndex(r => r.id === updatedRestaurant.id)
      if (index !== -1) {
        state.restaurants.splice(index, 1, updatedRestaurant)
      }
    },
    REMOVE_RESTAURANT(state, restaurantId) {
      state.restaurants = state.restaurants.filter(r => r.id !== restaurantId)
    }
  },

  actions: {
    // Get all restaurants with filters
    async getRestaurants({ commit }, params) {
      commit('SET_LOADING', true)
      try {
        const response = await adminAPI.getRestaurants(params)
        commit('SET_RESTAURANTS', response.data.restaurants)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // Get restaurant counts by status
    async getRestaurantCounts({ commit }) {
      try {
        const response = await adminAPI.getRestaurantCounts()
        commit('SET_RESTAURANT_COUNTS', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Get restaurant verification data
    async getRestaurantVerificationData({ commit }, restaurantId) {
      try {
        const response = await adminAPI.getRestaurantVerificationData(restaurantId)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Get pending menu items for review
    async getPendingMenuItems({ commit }, restaurantId) {
      try {
        const response = await adminAPI.getPendingMenuItems(restaurantId)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Get pending categories for review
    async getPendingCategories({ commit }, restaurantId) {
      try {
        const response = await adminAPI.getPendingCategories(restaurantId)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Approve a restaurant
    async approveRestaurant({ commit }, { restaurantId, verificationData }) {
      try {
        const response = await adminAPI.approveRestaurant(restaurantId, verificationData)
        commit('UPDATE_RESTAURANT', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Reject a restaurant
    async rejectRestaurant({ commit }, { restaurantId, reason }) {
      try {
        const response = await adminAPI.rejectRestaurant(restaurantId, { reason })
        commit('UPDATE_RESTAURANT', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Suspend a restaurant
    async suspendRestaurant({ commit }, { restaurantId, reason }) {
      try {
        const response = await adminAPI.suspendRestaurant(restaurantId, { reason })
        commit('UPDATE_RESTAURANT', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Activate a suspended restaurant
    async activateRestaurant({ commit }, restaurantId) {
      try {
        const response = await adminAPI.activateRestaurant(restaurantId)
        commit('UPDATE_RESTAURANT', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Delete a restaurant
    async deleteRestaurant({ commit }, restaurantId) {
      try {
        await adminAPI.deleteRestaurant(restaurantId)
        commit('REMOVE_RESTAURANT', restaurantId)
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Menu item management
    async approveMenuItem({ commit }, { restaurantId, itemId, notes }) {
      try {
        const response = await adminAPI.approveMenuItem(restaurantId, itemId, { notes })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    async rejectMenuItem({ commit }, { restaurantId, itemId, notes }) {
      try {
        const response = await adminAPI.rejectMenuItem(restaurantId, itemId, { notes })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Category management
    async approveCategory({ commit }, { restaurantId, categoryId, notes }) {
      try {
        const response = await adminAPI.approveCategory(restaurantId, categoryId, { notes })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    async rejectCategory({ commit }, { restaurantId, categoryId, notes }) {
      try {
        const response = await adminAPI.rejectCategory(restaurantId, categoryId, { notes })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    // Document management
    async requestDocument({ commit }, { restaurantId, documentId }) {
      try {
        const response = await adminAPI.requestDocument(restaurantId, documentId)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    }
  },

  getters: {
    getRestaurantById: state => id => {
      return state.restaurants.find(r => r.id === id)
    },
    pendingRestaurants: state => {
      return state.restaurants.filter(r => r.status === 'pending')
    },
    activeRestaurants: state => {
      return state.restaurants.filter(r => r.status === 'active')
    },
    suspendedRestaurants: state => {
      return state.restaurants.filter(r => r.status === 'suspended')
    }
  }
}

export default adminModule
