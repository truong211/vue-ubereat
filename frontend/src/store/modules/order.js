import api from '@/services/api';

// Initial state
const state = {
  orders: [],
  currentOrder: null,
  activeOrder: null,
  isLoading: false,
  error: null
};

// Getters
const getters = {
  allOrders: state => state.orders,
  currentOrder: state => state.currentOrder,
  activeOrder: state => state.activeOrder,
  isLoading: state => state.isLoading,
  orderError: state => state.error
};

// Actions
const actions = {
  // Fetch all user orders with pagination
  async fetchOrders({ commit }, { page = 1, limit = 10, status = null } = {}) {
    try {
      commit('SET_LOADING', true);
      
      let url = `/orders?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      
      const response = await api.get(url);
      commit('SET_ORDERS', response.data.data.orders);
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch orders');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch a single order by ID
  async fetchOrderById({ commit }, id) {
    try {
      commit('SET_LOADING', true);
      const response = await api.get(`/orders/${id}`);
      commit('SET_CURRENT_ORDER', response.data.data.order);
      return response.data.data.order;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch order details');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new order from cart
  async createOrder({ commit, dispatch }, { paymentMethod, deliveryInstructions = '' }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.post('/orders', {
        paymentMethod,
        deliveryInstructions
      });
      
      const order = response.data.data.order;
      commit('SET_CURRENT_ORDER', order);
      
      // Set as active order for tracking
      commit('SET_ACTIVE_ORDER', order);
      
      return order;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create order');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Cancel an order
  async cancelOrder({ commit }, { id, cancellationReason }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.put(`/orders/${id}/cancel`, { cancellationReason });
      commit('UPDATE_ORDER_STATUS', { id, status: 'cancelled' });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to cancel order');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Rate and review an order
  async rateOrder({ commit }, { id, rating, review = '' }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.post(`/orders/${id}/review`, { rating, review });
      commit('UPDATE_ORDER_RATING', { id, rating, review });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to submit rating');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Clear error messages
  clearErrors({ commit }) {
    commit('SET_ERROR', null);
  }
};

// Mutations
const mutations = {
  SET_LOADING(state, status) {
    state.isLoading = status;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  SET_ORDERS(state, orders) {
    state.orders = orders;
  },
  
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order;
  },
  
  SET_ACTIVE_ORDER(state, order) {
    state.activeOrder = order;
  },
  
  UPDATE_ORDER_STATUS(state, { id, status }) {
    // Update in orders list
    const order = state.orders.find(o => o.id === id);
    if (order) {
      order.status = status;
    }
    
    // Update current order if it's the active one
    if (state.currentOrder && state.currentOrder.id === id) {
      state.currentOrder.status = status;
    }
    
    // Update active order if it's the active one
    if (state.activeOrder && state.activeOrder.id === id) {
      state.activeOrder.status = status;
    }
  },
  
  UPDATE_ORDER_RATING(state, { id, rating, review }) {
    // Update in orders list
    const order = state.orders.find(o => o.id === id);
    if (order) {
      order.rating = rating;
      order.review = review;
      order.isRated = true;
    }
    
    // Update current order if it's the active one
    if (state.currentOrder && state.currentOrder.id === id) {
      state.currentOrder.rating = rating;
      state.currentOrder.review = review;
      state.currentOrder.isRated = true;
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};