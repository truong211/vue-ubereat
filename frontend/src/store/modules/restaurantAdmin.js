import axios from 'axios'

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
    },
    menuItems: [],
    reviews: [],
    notifications: [],
    promotions: [],
    loading: false,
    error: null
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
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
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
    getActivePromotions: state => state.promotions.filter(p => p.active)
  }
}
