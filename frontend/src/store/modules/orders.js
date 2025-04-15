import { defineStore } from 'pinia';
import { orderAPI } from '../../services/api.service';

// Vuex Store (default export)
export default {
  namespaced: true,
  state: () => ({
    orders: [],
    currentOrder: null,
    total: 0,
    loading: false,
    error: null
  }),

  mutations: {
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
  },

  actions: {
    async fetchOrders({ commit }, params) {
      commit('SET_LOADING', true);
      try {
        const response = await orderAPI.getUserOrders(params);
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
        const response = await orderAPI.getOrderById(orderId);
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
        const response = await orderAPI.updateOrderStatus(orderId, status);
        commit('UPDATE_ORDER_STATUS', { orderId, status });
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    async cancelOrder({ commit }, { id, cancellationReason }) {
      try {
        commit('SET_LOADING', true);
        const response = await orderAPI.cancelOrder(id, cancellationReason);
        commit('UPDATE_ORDER_STATUS', { orderId: id, status: 'cancelled' });
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to cancel order');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async submitReview({ commit }, formData) {
      try {
        commit('SET_LOADING', true);
        const response = await orderAPI.addOrderReview(formData.orderId, formData);
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to submit review';
        commit('SET_ERROR', errorMessage);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },

  getters: {
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
  }
};

// Pinia Store (named export)
export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
    currentOrder: null,
    total: 0,
    loading: false,
    error: null
  }),

  actions: {
    async fetchOrders(params) {
      this.loading = true;
      try {
        const response = await orderAPI.getUserOrders(params);
        this.orders = response.data.orders;
        this.total = response.data.total;
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchOrderDetails(orderId) {
      this.loading = true;
      try {
        const response = await orderAPI.getOrderById(orderId);
        this.currentOrder = response.data;
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateOrderStatus({ orderId, status, reason, note }) {
      try {
        const response = await orderAPI.updateOrderStatus(orderId, status);
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = status;
        }
        if (this.currentOrder && this.currentOrder.id === orderId) {
          this.currentOrder.status = status;
        }
        return response.data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async cancelOrder({ id, cancellationReason }) {
      try {
        this.loading = true;
        const response = await orderAPI.cancelOrder(id, cancellationReason);
        
        // Update the order status locally
        const order = this.orders.find(o => o.id === id);
        if (order) {
          order.status = 'cancelled';
        }
        if (this.currentOrder && this.currentOrder.id === id) {
          this.currentOrder.status = 'cancelled';
        }
        
        return response.data;
      } catch (error) {
        this.error = error.message || 'Failed to cancel order';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async submitReview(formData) {
      try {
        this.loading = true;
        const response = await orderAPI.addOrderReview(formData.orderId, formData);
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to submit review';
        this.error = errorMessage;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  },

  getters: {
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
  }
});