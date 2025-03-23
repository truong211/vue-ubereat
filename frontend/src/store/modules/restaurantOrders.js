import axios from 'axios'

const state = {
  orders: [],
  currentOrder: null,
  totalOrders: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  ordersByStatus: {
    pending: [],
    preparing: [],
    ready: [],
    completed: [],
    cancelled: []
  }
}

const getters = {
  getOrdersByStatus: state => status => state.ordersByStatus[status] || [],
  getAllOrders: state => state.orders,
  getCurrentOrder: state => state.currentOrder,
  isLoading: state => state.isLoading,
  error: state => state.error,
  pendingOrdersCount: state => state.ordersByStatus.pending?.length || 0
}

const actions = {
  // Fetch orders for a restaurant with filters
  async fetchOrders({ commit, rootState }, { status = 'all', page = 1, limit = 10 } = {}) {
    try {
      commit('SET_LOADING', true)
      const restaurantId = rootState.auth.user.restaurantId
      const response = await axios.get(`/api/orders/restaurant/${restaurantId}`, {
        params: { status, page, limit }
      })
      
      commit('SET_ORDERS', response.data.data.orders)
      commit('SET_PAGINATION', {
        totalOrders: response.data.results,
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      })
      
      // Group orders by status
      const ordersByStatus = {
        pending: [],
        preparing: [],
        ready: [],
        completed: [],
        cancelled: []
      }
      
      response.data.data.orders.forEach(order => {
        if (ordersByStatus[order.status]) {
          ordersByStatus[order.status].push(order)
        }
      })
      
      commit('SET_ORDERS_BY_STATUS', ordersByStatus)
      return response.data
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải danh sách đơn hàng')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Update order status
  async updateOrderStatus({ commit }, { orderId, status, note }) {
    try {
      commit('SET_LOADING', true)
      const response = await axios.patch(`/api/orders/${orderId}/status`, {
        status,
        note
      })
      
      commit('UPDATE_ORDER_STATUS', response.data.data.order)
      return response.data.data.order
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Get details of a specific order
  async fetchOrderDetails({ commit }, orderId) {
    try {
      commit('SET_LOADING', true)
      const response = await axios.get(`/api/orders/${orderId}`)
      commit('SET_CURRENT_ORDER', response.data.data.order)
      return response.data.data.order
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải chi tiết đơn hàng')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Handle real-time order updates
  handleOrderUpdate({ commit }, orderData) {
    commit('UPDATE_ORDER_STATUS', orderData)
  },

  // Clear error messages
  clearError({ commit }) {
    commit('SET_ERROR', null)
  }
}

const mutations = {
  SET_LOADING(state, status) {
    state.isLoading = status
  },

  SET_ERROR(state, error) {
    state.error = error
  },

  SET_ORDERS(state, orders) {
    state.orders = orders
  },

  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order
  },

  SET_PAGINATION(state, { totalOrders, currentPage, totalPages }) {
    state.totalOrders = totalOrders
    state.currentPage = currentPage
    state.totalPages = totalPages
  },

  SET_ORDERS_BY_STATUS(state, ordersByStatus) {
    state.ordersByStatus = ordersByStatus
  },

  UPDATE_ORDER_STATUS(state, updatedOrder) {
    // Update in main orders array
    const index = state.orders.findIndex(order => order.id === updatedOrder.id)
    if (index !== -1) {
      state.orders[index] = updatedOrder
    }

    // Update in status-grouped orders
    if (updatedOrder.status) {
      // Remove from old status array
      Object.keys(state.ordersByStatus).forEach(status => {
        state.ordersByStatus[status] = state.ordersByStatus[status].filter(
          order => order.id !== updatedOrder.id
        )
      })

      // Add to new status array
      if (state.ordersByStatus[updatedOrder.status]) {
        state.ordersByStatus[updatedOrder.status].push(updatedOrder)
      }
    }

    // Update current order if it's the same
    if (state.currentOrder?.id === updatedOrder.id) {
      state.currentOrder = updatedOrder
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}