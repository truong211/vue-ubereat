import axios from 'axios'

export default {
  namespaced: true,
  
  state: {
    currentOrder: null,
    orderHistory: [],
    orderDetails: {},
    activeOrder: null,
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
    
    setCurrentOrder(state, order) {
      state.currentOrder = order
    },
    
    setOrderHistory(state, orders) {
      state.orderHistory = orders
    },
    
    setOrderDetails(state, { orderId, details }) {
      state.orderDetails = { 
        ...state.orderDetails, 
        [orderId]: details
      }
    },
    
    setActiveOrder(state, order) {
      state.activeOrder = order
    },
    
    updateOrderStatus(state, { orderId, status, updatedAt }) {
      // Update in history if exists
      const historyOrder = state.orderHistory.find(o => o.id === orderId)
      if (historyOrder) {
        historyOrder.status = status
        historyOrder.updatedAt = updatedAt
      }
      
      // Update in details if exists
      if (state.orderDetails[orderId]) {
        state.orderDetails[orderId].status = status
        state.orderDetails[orderId].updatedAt = updatedAt
      }
      
      // Update active order if it's the current one
      if (state.activeOrder?.id === orderId) {
        state.activeOrder.status = status
        state.activeOrder.updatedAt = updatedAt
      }
      
      // Update current order if it's the current one
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status
        state.currentOrder.updatedAt = updatedAt
      }
    },
    
    updateDriverLocation(state, { orderId, location }) {
      // Update in active order if it's the current one
      if (state.activeOrder?.id === orderId) {
        state.activeOrder.driverLocation = location
      }
      
      // Update in order details if exists
      if (state.orderDetails[orderId]) {
        state.orderDetails[orderId].driverLocation = location
      }
    },
    
    updateOrderETA(state, { orderId, eta }) {
      // Update in active order if it's the current one
      if (state.activeOrder?.id === orderId) {
        state.activeOrder.eta = eta
      }
      
      // Update in order details if exists
      if (state.orderDetails[orderId]) {
        state.orderDetails[orderId].eta = eta
      }
    }
  },
  
  actions: {
    async createOrder({ commit, rootState, dispatch }, { deliveryAddress, paymentMethod, deliveryInstructions }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const orderData = {
          items: rootState.cart.items,
          deliveryAddress,
          paymentMethod,
          deliveryInstructions,
          promoCode: rootState.cart.appliedPromo?.code
        }
        
        const response = await axios.post('/api/orders', orderData)
        
        // Clear the cart after successful order
        dispatch('cart/clearCart', null, { root: true })
        
        // Set the current order
        commit('setCurrentOrder', response.data)
        
        // Set the active order for tracking
        commit('setActiveOrder', response.data)
        
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to create order'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async fetchOrderHistory({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/orders')
        commit('setOrderHistory', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch order history'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async fetchOrderDetails({ commit, state }, orderId) {
      // Return cached details if available
      if (state.orderDetails[orderId]) {
        return state.orderDetails[orderId]
      }
      
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get(`/api/orders/${orderId}`)
        commit('setOrderDetails', { 
          orderId, 
          details: response.data 
        })
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch order details'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async trackOrder({ commit }, orderId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get(`/api/orders/${orderId}/track`)
        commit('setActiveOrder', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to track order'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async cancelOrder({ commit }, orderId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post(`/api/orders/${orderId}/cancel`)
        commit('updateOrderStatus', { 
          orderId, 
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to cancel order'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async rateOrder({ commit }, { orderId, rating, comment }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post(`/api/orders/${orderId}/review`, {
          rating,
          comment
        })
        
        // Update the order in history
        const updatedOrder = { ...state.orderDetails[orderId], rating, comment }
        commit('setOrderDetails', { orderId, details: updatedOrder })
        
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to rate order'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async reorder({ dispatch, state }, orderId) {
      try {
        // First, ensure we have the order details
        let orderDetails = state.orderDetails[orderId]
        
        if (!orderDetails) {
          orderDetails = await dispatch('fetchOrderDetails', orderId)
        }
        
        // Clear current cart
        await dispatch('cart/clearCart', null, { root: true })
        
        // Add all items from previous order to cart
        for (const item of orderDetails.items) {
          await dispatch('cart/addToCart', {
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            options: item.options,
            restaurantId: orderDetails.restaurantId
          }, { root: true })
        }
        
        // Apply promo code if it was used
        if (orderDetails.promoCode) {
          try {
            await dispatch('cart/applyPromoCode', orderDetails.promoCode, { root: true })
          } catch (error) {
            console.warn('Failed to apply previous promo code', error)
          }
        }
        
        return true
      } catch (error) {
        console.error('Reorder failed:', error)
        throw error
      }
    },
    
    // Handle realtime updates
    handleOrderStatusUpdate({ commit }, { orderId, status, updatedAt }) {
      commit('updateOrderStatus', { orderId, status, updatedAt })
    },
    
    handleDriverLocationUpdate({ commit }, { orderId, location }) {
      commit('updateDriverLocation', { orderId, location })
    },
    
    handleOrderETAUpdate({ commit }, { orderId, eta }) {
      commit('updateOrderETA', { orderId, eta })
    }
  },
  
  getters: {
    isLoading: state => state.loading,
    error: state => state.error,
    currentOrder: state => state.currentOrder,
    orderHistory: state => state.orderHistory,
    activeOrder: state => state.activeOrder,
    orderDetails: state => orderId => state.orderDetails[orderId],
    hasActiveOrder: state => !!state.activeOrder,
    
    // Get orders by status
    getOrdersByStatus: state => status => {
      return state.orderHistory.filter(order => order.status === status)
    },
    
    // Get active order status
    activeOrderStatus: state => {
      return state.activeOrder?.status || null
    },
    
    // Check if active order is in a particular status
    isActiveOrderInStatus: state => status => {
      return state.activeOrder?.status === status
    },
    
    // Get recent orders (last 30 days)
    recentOrders: state => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return state.orderHistory.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= thirtyDaysAgo
      })
    },
    
    // Get frequently ordered items
    frequentItems: state => {
      // Flatten all items from order history
      const allItems = state.orderHistory
        .flatMap(order => order.items)
        .filter(Boolean)
      
      // Count occurrences of each item by name
      const itemCounts = {}
      allItems.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = {
            name: item.name,
            count: 0,
            lastOrdered: null,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName
          }
        }
        itemCounts[item.name].count += item.quantity || 1
      })
      
      // Convert to array and sort by count
      return Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
    }
  }
}