import axios from 'axios'

export default {
  namespaced: true,
  
  state: {
    profile: null,
    isOnline: false,
    currentLocation: null,
    activeOrders: [],
    availableOrders: [],
    earnings: {
      today: 0,
      week: 0,
      month: 0,
      total: 0
    },
    earningsHistory: [],
    performance: {
      rating: 0,
      totalDeliveries: 0,
      acceptanceRate: 0,
      completionRate: 0
    },
    settings: {
      notificationsEnabled: true,
      autoAcceptOrders: false,
      navigationProvider: 'google', // 'google', 'waze', 'apple'
      maxActiveOrders: 1
    },
    loading: false,
    error: null
  },
  
  mutations: {
    setLoading(state, status) {
      state.loading = status
    },
    
    setError(state, error) {
      state.error = error
    },
    
    setProfile(state, profile) {
      state.profile = profile
    },
    
    setOnlineStatus(state, isOnline) {
      state.isOnline = isOnline
    },
    
    setCurrentLocation(state, location) {
      state.currentLocation = location
    },
    
    setActiveOrders(state, orders) {
      state.activeOrders = orders
    },
    
    addActiveOrder(state, order) {
      if (!state.activeOrders.find(o => o.id === order.id)) {
        state.activeOrders.push(order)
      }
    },
    
    updateActiveOrder(state, { orderId, updates }) {
      const index = state.activeOrders.findIndex(o => o.id === orderId)
      if (index !== -1) {
        state.activeOrders[index] = {
          ...state.activeOrders[index],
          ...updates
        }
      }
    },
    
    removeActiveOrder(state, orderId) {
      state.activeOrders = state.activeOrders.filter(o => o.id !== orderId)
    },
    
    setAvailableOrders(state, orders) {
      state.availableOrders = orders
    },
    
    addAvailableOrder(state, order) {
      if (!state.availableOrders.find(o => o.id === order.id)) {
        state.availableOrders.push(order)
      }
    },
    
    removeAvailableOrder(state, orderId) {
      state.availableOrders = state.availableOrders.filter(o => o.id !== orderId)
    },
    
    setEarnings(state, earnings) {
      state.earnings = { ...state.earnings, ...earnings }
    },
    
    setEarningsHistory(state, history) {
      state.earningsHistory = history
    },
    
    setPerformance(state, performance) {
      state.performance = { ...state.performance, ...performance }
    },
    
    updateSettings(state, settings) {
      state.settings = { ...state.settings, ...settings }
    }
  },
  
  actions: {
    async fetchProfile({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/driver/profile')
        commit('setProfile', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch driver profile'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateProfile({ commit }, profileData) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.put('/api/driver/profile', profileData)
        commit('setProfile', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update driver profile'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async goOnline({ commit, state }, location) {
      if (state.isOnline) return
      
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.post('/api/driver/status', {
          isOnline: true,
          location
        })
        
        commit('setOnlineStatus', true)
        commit('setCurrentLocation', location)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to go online'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async goOffline({ commit, state }) {
      if (!state.isOnline) return
      
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.post('/api/driver/status', {
          isOnline: false
        })
        
        commit('setOnlineStatus', false)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to go offline'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateLocation({ commit, state }, location) {
      // Don't update if offline
      if (!state.isOnline) return
      
      commit('setCurrentLocation', location)
      
      try {
        await axios.post('/api/driver/location', { location })
        
        // Update location for active orders
        if (state.activeOrders.length > 0) {
          state.activeOrders.forEach(order => {
            axios.post(`/api/driver/orders/${order.id}/location`, { location })
          })
        }
      } catch (error) {
        console.error('Failed to update location:', error)
      }
    },
    
    async fetchAvailableOrders({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/driver/orders/available')
        commit('setAvailableOrders', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch available orders'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async fetchActiveOrders({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/driver/orders/active')
        commit('setActiveOrders', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch active orders'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async acceptOrder({ commit, state }, orderId) {
      commit('setLoading', true)
      commit('setError', null)
      
      if (state.settings.maxActiveOrders <= state.activeOrders.length) {
        const errorMsg = 'Cannot accept more orders. Maximum limit reached.'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw new Error(errorMsg)
      }
      
      try {
        const response = await axios.post(`/api/driver/orders/${orderId}/accept`, {
          location: state.currentLocation
        })
        
        // Remove from available orders
        commit('removeAvailableOrder', orderId)
        
        // Add to active orders
        commit('addActiveOrder', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to accept order'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async rejectOrder({ commit }, orderId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.post(`/api/driver/orders/${orderId}/reject`)
        
        // Remove from available orders
        commit('removeAvailableOrder', orderId)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to reject order'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateOrderStatus({ commit }, { orderId, status }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post(`/api/driver/orders/${orderId}/status`, {
          status
        })
        
        commit('updateActiveOrder', {
          orderId,
          updates: { status, updatedAt: new Date().toISOString() }
        })
        
        // If order is complete or canceled, remove from active orders
        if (['delivered', 'cancelled'].includes(status)) {
          commit('removeActiveOrder', orderId)
        }
        
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update order status'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async fetchEarnings({ commit }, timeframe = 'all') {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/driver/earnings', {
          params: { timeframe }
        })
        commit('setEarnings', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch earnings'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async fetchEarningsHistory({ commit }, { startDate, endDate }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/driver/earnings/history', {
          params: { startDate, endDate }
        })
        commit('setEarningsHistory', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch earnings history'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async fetchPerformance({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/driver/performance')
        commit('setPerformance', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch performance metrics'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateSettings({ commit }, settings) {
      try {
        const response = await axios.put('/api/driver/settings', settings)
        commit('updateSettings', response.data)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update settings'
        throw errorMsg
      }
    },
    
    // Handle websocket updates
    handleNewOrder({ commit }, order) {
      commit('addAvailableOrder', order)
      
      // Auto-accept order if enabled
      if (state.settings.autoAcceptOrders && state.activeOrders.length < state.settings.maxActiveOrders) {
        this.dispatch('acceptOrder', order.id)
      }
    },
    
    handleOrderCancelled({ commit }, orderId) {
      commit('removeActiveOrder', orderId)
      commit('removeAvailableOrder', orderId)
    },
    
    handleOrderAssigned({ commit, dispatch }, order) {
      // Another driver was assigned
      if (order.driverId !== state.profile?.id) {
        commit('removeAvailableOrder', order.id)
      }
    }
  },
  
  getters: {
    isLoading: state => state.loading,
    error: state => state.error,
    profile: state => state.profile,
    isOnline: state => state.isOnline,
    currentLocation: state => state.currentLocation,
    activeOrders: state => state.activeOrders,
    availableOrders: state => state.availableOrders,
    earnings: state => state.earnings,
    earningsHistory: state => state.earningsHistory,
    performance: state => state.performance,
    settings: state => state.settings,
    
    // Derived getters
    activeOrderCount: state => state.activeOrders.length,
    
    availableOrderCount: state => state.availableOrders.length,
    
    canAcceptMoreOrders: state => {
      return state.activeOrders.length < state.settings.maxActiveOrders
    },
    
    getOrderById: state => id => {
      return state.activeOrders.find(o => o.id === id) || 
             state.availableOrders.find(o => o.id === id)
    },
    
    totalEarningsToday: state => state.earnings.today,
    
    averageRating: state => state.performance.rating,
    
    completedDeliveries: state => state.performance.totalDeliveries
  }
}
