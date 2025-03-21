import axios from 'axios'
import { io } from 'socket.io-client'

export default {
  namespaced: true,

  state: {
    restaurant: null,
    orders: [],
    pendingOrders: [],
    metrics: {
      todayOrders: 0,
      todayRevenue: 0,
      monthlyOrders: 0,
      monthlyRevenue: 0,
      avgDeliveryTime: 0,
      avgRating: 0,
      avgOrderValue: 0,
      avgOrderTrend: 0,
      ordersTrend: 0,
      revenueTrend: 0
    },
    menuItems: [],
    reviews: [],
    notifications: [],
    promotions: [],
    categories: [],
    socket: null,
    loading: false,
    error: null,
    settings: {
      openingHours: null,
      deliverySettings: null,
      notificationPreferences: null,
      specialHolidays: [],
      menuAvailability: {
        scheduleEnabled: false,
        defaultAvailability: true,
        schedules: []
      },
      tempClosureSettings: {
        isTemporarilyClosed: false,
        reopenDate: null,
        closureReason: null,
        showReason: true,
        acceptPreOrders: false
      }
    }
  },

  mutations: {
    setRestaurant(state, restaurant) {
      state.restaurant = restaurant
    },
    setOrders(state, orders) {
      state.orders = orders
    },
    setPendingOrders(state, orders) {
      state.pendingOrders = orders
    },
    addPendingOrder(state, order) {
      state.pendingOrders.unshift(order)
    },
    updateOrderStatus(state, { orderId, status }) {
      const order = state.orders.find(o => o.id === orderId)
      if (order) {
        order.status = status
      }
      // Remove from pending if status is completed or cancelled
      if (['completed', 'cancelled'].includes(status)) {
        state.pendingOrders = state.pendingOrders.filter(o => o.id !== orderId)
      }
    },
    setMetrics(state, metrics) {
      state.metrics = { ...state.metrics, ...metrics }
    },
    setMenuItems(state, items) {
      state.menuItems = items
    },
    addMenuItem(state, item) {
      state.menuItems.push(item)
    },
    updateMenuItem(state, updatedItem) {
      const index = state.menuItems.findIndex(item => item.id === updatedItem.id)
      if (index !== -1) {
        state.menuItems.splice(index, 1, updatedItem)
      }
    },
    removeMenuItem(state, itemId) {
      state.menuItems = state.menuItems.filter(item => item.id !== itemId)
    },
    setReviews(state, reviews) {
      state.reviews = reviews
    },
    addReview(state, review) {
      state.reviews.unshift(review)
    },
    setNotifications(state, notifications) {
      state.notifications = notifications
    },
    addNotification(state, notification) {
      state.notifications.unshift(notification)
    },
    markNotificationAsRead(state, notificationId) {
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsAsRead(state) {
      state.notifications.forEach(n => n.read = true)
    },
    setPromotions(state, promotions) {
      state.promotions = promotions
    },
    addPromotion(state, promotion) {
      state.promotions.push(promotion)
    },
    updatePromotion(state, updatedPromotion) {
      const index = state.promotions.findIndex(p => p.id === updatedPromotion.id)
      if (index !== -1) {
        state.promotions.splice(index, 1, updatedPromotion)
      }
    },
    removePromotion(state, promotionId) {
      state.promotions = state.promotions.filter(p => p.id !== promotionId)
    },
    setCategories(state, categories) {
      state.categories = categories
    },
    setSocket(state, socket) {
      state.socket = socket
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
    SET_RESTAURANT_SETTINGS(state, settings) {
      state.settings = settings;
    },
    UPDATE_OPENING_HOURS(state, hours) {
      state.settings.openingHours = hours;
    },
    UPDATE_DELIVERY_SETTINGS(state, settings) {
      state.settings.deliverySettings = settings;
    },
    UPDATE_NOTIFICATION_PREFERENCES(state, preferences) {
      state.settings.notificationPreferences = preferences;
    },
    UPDATE_SPECIAL_HOLIDAYS(state, holidays) {
      state.settings.specialHolidays = holidays;
    },
    UPDATE_MENU_AVAILABILITY(state, settings) {
      state.settings.menuAvailability = settings;
    },
    UPDATE_TEMP_CLOSURE(state, settings) {
      state.settings.tempClosureSettings = settings;
    }
  },

  actions: {
    async fetchRestaurantDetails({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/details')
        commit('setRestaurant', response.data)
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch restaurant details')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async updateStatus({ commit }, isOpen) {
      try {
        await axios.post('/api/restaurant/status', { isOpen })
        commit('setRestaurant', { ...state.restaurant, isOpen })
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to update status')
        throw error
      }
    },

    async fetchOrders({ commit }, { status = 'all', page = 1, limit = 10 } = {}) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/orders', {
          params: { status, page, limit }
        })
        if (status === 'pending') {
          commit('setPendingOrders', response.data.orders)
        } else {
          commit('setOrders', response.data.orders)
        }
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch orders')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async updateOrder({ commit }, { orderId, status }) {
      try {
        await axios.patch(`/api/restaurant/orders/${orderId}`, { status })
        commit('updateOrderStatus', { orderId, status })
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to update order')
        throw error
      }
    },

    async fetchMetrics({ commit }, { timeframe = 'today' } = {}) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/metrics', {
          params: { timeframe }
        })
        commit('setMetrics', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch metrics')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async fetchMenuItems({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/menu')
        commit('setMenuItems', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch menu items')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async createMenuItem({ commit }, itemData) {
      try {
        const response = await axios.post('/api/restaurant/menu', itemData)
        commit('addMenuItem', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to create menu item')
        throw error
      }
    },

    async updateMenuItem({ commit }, { id, ...itemData }) {
      try {
        const response = await axios.put(`/api/restaurant/menu/${id}`, itemData)
        commit('updateMenuItem', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to update menu item')
        throw error
      }
    },

    async deleteMenuItem({ commit }, itemId) {
      try {
        await axios.delete(`/api/restaurant/menu/${itemId}`)
        commit('removeMenuItem', itemId)
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to delete menu item')
        throw error
      }
    },

    async fetchReviews({ commit }, { page = 1, limit = 10 } = {}) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/reviews', {
          params: { page, limit }
        })
        commit('setReviews', response.data.reviews)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch reviews')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async respondToReview({ commit }, { reviewId, response }) {
      try {
        await axios.post(`/api/restaurant/reviews/${reviewId}/respond`, { response })
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to respond to review')
        throw error
      }
    },

    async fetchNotifications({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/notifications')
        commit('setNotifications', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch notifications')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async fetchPromotions({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/promotions')
        commit('setPromotions', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch promotions')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async createPromotion({ commit }, promotionData) {
      try {
        const response = await axios.post('/api/restaurant/promotions', promotionData)
        commit('addPromotion', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to create promotion')
        throw error
      }
    },

    async updatePromotion({ commit }, { id, ...promotionData }) {
      try {
        const response = await axios.put(`/api/restaurant/promotions/${id}`, promotionData)
        commit('updatePromotion', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to update promotion')
        throw error
      }
    },

    async deletePromotion({ commit }, promotionId) {
      try {
        await axios.delete(`/api/restaurant/promotions/${promotionId}`)
        commit('removePromotion', promotionId)
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to delete promotion')
        throw error
      }
    },

    async fetchCategories({ commit }) {
      try {
        const response = await axios.get('/api/restaurant/categories')
        commit('setCategories', response.data)
      } catch (error) {
        commit('setError', error.message)
        throw error
      }
    },

    initializeWebSocket({ commit, dispatch }) {
      const socket = io('/restaurant', {
        auth: {
          token: localStorage.getItem('token')
        }
      })

      socket.on('connect', () => {
        console.log('WebSocket connected')
      })

      socket.on('new_order', (order) => {
        commit('addOrder', order)
        // Trigger notification sound and update metrics
        dispatch('fetchMetrics')
      })

      socket.on('order_updated', (order) => {
        commit('updateOrder', order)
      })

      socket.on('error', (error) => {
        commit('setError', error)
      })

      commit('setSocket', socket)
    },

    async fetchRestaurantSettings({ commit }, restaurantId) {
      try {
        const response = await axios.get(`/api/restaurants/${restaurantId}`);
        const { 
          openingHours, 
          deliverySettings, 
          notificationPreferences, 
          specialHolidays,
          menuAvailability,
          tempClosureSettings
        } = response.data.data.restaurant;
        
        commit('SET_RESTAURANT_SETTINGS', {
          openingHours,
          deliverySettings,
          notificationPreferences,
          specialHolidays: specialHolidays || [],
          menuAvailability: menuAvailability || {
            scheduleEnabled: false,
            defaultAvailability: true,
            schedules: []
          },
          tempClosureSettings: tempClosureSettings || {
            isTemporarilyClosed: false,
            reopenDate: null,
            closureReason: null,
            showReason: true,
            acceptPreOrders: false
          }
        });
        
        return response.data.data.restaurant;
      } catch (error) {
        console.error('Error fetching restaurant settings:', error);
        throw error;
      }
    },

    async updateRestaurantSettings({ commit }, { restaurantId, section, data }) {
      try {
        const response = await axios.patch(`/api/restaurants/${restaurantId}/settings`, {
          [section]: data
        });
        
        const mutationMap = {
          openingHours: 'UPDATE_OPENING_HOURS',
          deliverySettings: 'UPDATE_DELIVERY_SETTINGS',
          notificationPreferences: 'UPDATE_NOTIFICATION_PREFERENCES'
        };
        
        if (mutationMap[section]) {
          commit(mutationMap[section], data);
        }
        
        return response.data;
      } catch (error) {
        console.error('Error updating restaurant settings:', error);
        throw error;
      }
    },

    async updateSpecialHolidays({ commit }, { restaurantId, holidays }) {
      try {
        const response = await axios.patch(`/api/restaurants/${restaurantId}/holidays`, {
          specialHolidays: holidays
        });
        
        commit('UPDATE_SPECIAL_HOLIDAYS', holidays);
        return response.data;
      } catch (error) {
        console.error('Error updating special holidays:', error);
        throw error;
      }
    },

    async checkRestaurantAvailability({ commit }, { restaurantId, date }) {
      try {
        const response = await axios.get(`/api/restaurants/${restaurantId}/availability`, {
          params: { date }
        });
        return response.data.data;
      } catch (error) {
        console.error('Error checking restaurant availability:', error);
        throw error;
      }
    },

    async updateMenuAvailability({ commit }, { restaurantId, settings }) {
      try {
        const response = await axios.patch(`/api/restaurants/${restaurantId}/menu-availability`, {
          menuAvailability: settings
        });
        commit('UPDATE_MENU_AVAILABILITY', settings);
        return response.data;
      } catch (error) {
        console.error('Error updating menu availability:', error);
        throw error;
      }
    },

    async updateTempClosure({ commit }, { restaurantId, settings }) {
      try {
        const response = await axios.patch(`/api/restaurants/${restaurantId}/temp-closure`, {
          tempClosureSettings: settings
        });
        commit('UPDATE_TEMP_CLOSURE', settings);
        return response.data;
      } catch (error) {
        console.error('Error updating temporary closure settings:', error);
        throw error;
      }
    }
  },

  getters: {
    isLoading: state => state.loading,
    getError: state => state.error,
    getRestaurant: state => state.restaurant,
    getPendingOrders: state => state.pendingOrders,
    getOrders: state => state.orders,
    getMetrics: state => state.metrics,
    getMenuItems: state => state.menuItems,
    getReviews: state => state.reviews,
    getNotifications: state => state.notifications,
    getUnreadNotifications: state => state.notifications.filter(n => !n.read),
    getPromotions: state => state.promotions,
    getActivePromotions: state => state.promotions.filter(p => p.active),
    pendingOrders: state => {
      return state.orders.filter(order => order.status === 'pending')
    },
    preparingOrders: state => {
      return state.orders.filter(order => order.status === 'preparing')
    },
    readyOrders: state => {
      return state.orders.filter(order => order.status === 'ready')
    },
    inProgressOrders: state => {
      return state.orders.filter(order => 
        ['pending', 'preparing', 'ready'].includes(order.status)
      )
    },
    menuItemsByCategory: state => {
      return state.menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      }, {})
    }
  }
}
