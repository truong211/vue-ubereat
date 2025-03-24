import axios from 'axios';

const state = {
  orders: [],
  currentOrder: null,
  total: 0,
  loading: false,
  error: null
};

const mutations = {
  SET_ORDERS(state, { orders, total }) {
    state.orders = orders;
    state.total = total;
  },
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  UPDATE_ORDER_STATUS(state, { orderId, status }) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
    }
    if (state.currentOrder && state.currentOrder.id === orderId) {
      state.currentOrder.status = status;
    }
  }
};

const actions = {
  async fetchOrders({ commit }, params) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/api/admin/orders', { params });
      commit('SET_ORDERS', {
        orders: response.data.orders,
        total: response.data.total
      });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchOrderDetails({ commit }, orderId) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/api/admin/orders/${orderId}`);
      commit('SET_CURRENT_ORDER', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateOrderStatus({ commit }, { orderId, status, reason, note }) {
    try {
      const response = await axios.patch(`/api/admin/orders/${orderId}/status`, {
        status,
        reason,
        note
      });
      commit('UPDATE_ORDER_STATUS', { orderId, status });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  /**
   * Submit a comprehensive review including item ratings and images
   */
  async submitReview({ commit }, formData) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.post(`${API_ENDPOINT}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      commit('SET_ERROR', errorMessage);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  getOrderById: (state) => (id) => {
    return state.orders.find(order => order.id === id);
  },
  pendingOrders: (state) => {
    return state.orders.filter(order => order.status === 'pending');
  },
  activeOrders: (state) => {
    return state.orders.filter(order => 
      ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(order.status)
    );
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};