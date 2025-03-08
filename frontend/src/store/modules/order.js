import axios from 'axios'

const state = {
  currentOrder: null,
  orderStatuses: [],
  driverLocation: null,
  loading: false,
  error: null
}

const mutations = {
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order
  },
  ADD_ORDER_STATUS(state, status) {
    state.orderStatuses.push(status)
  },
  UPDATE_DRIVER_LOCATION(state, location) {
    state.driverLocation = location
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async fetchOrder({ commit }, orderId) {
    try {
      commit('SET_LOADING', true)
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}`)
      commit('SET_CURRENT_ORDER', response.data)
      
      // Initialize order statuses
      if (response.data.statusHistory) {
        response.data.statusHistory.forEach(status => {
          commit('ADD_ORDER_STATUS', {
            status: status.status,
            description: status.description,
            timestamp: new Date(status.timestamp)
          })
        })
      }
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  updateOrderStatus({ commit }, status) {
    commit('ADD_ORDER_STATUS', {
      ...status,
      timestamp: new Date()
    })
  },

  updateDriverLocation({ commit }, location) {
    commit('UPDATE_DRIVER_LOCATION', location)
  }
}

const getters = {
  currentOrder: state => state.currentOrder,
  orderStatuses: state => state.orderStatuses,
  driverLocation: state => state.driverLocation,
  isLoading: state => state.loading,
  error: state => state.error
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}