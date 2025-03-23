import api from '@/services/api';

// Initial state
const state = {
  cart: null,
  isLoading: false,
  error: null
};

// Getters
const getters = {
  cartItemCount: state => state.cart?.items?.length || 0,
  cartTotal: state => state.cart?.total || 0,
  hasItems: state => state.cart?.items?.length > 0
};

// Actions
const actions = {
  // Fetch the user's cart
  async fetchCart({ commit }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.get('/cart');
      commit('SET_CART', response.data.data);
      return response.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Add item to cart
  async addToCart({ commit, dispatch }, payload) {
    try {
      commit('SET_LOADING', true);
      const response = await api.post('/cart', payload);
      await dispatch('fetchCart'); // Refresh cart after adding item
      return response.data.data.cartItem;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to add item to cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update cart item
  async updateCartItem({ commit, dispatch }, { id, quantity, options, notes }) {
    try {
      commit('SET_LOADING', true);
      const payload = {};
      if (quantity !== undefined) payload.quantity = quantity;
      if (options !== undefined) payload.options = options;
      if (notes !== undefined) payload.notes = notes;
      
      const response = await api.patch(`/cart/${id}`, payload);
      await dispatch('fetchCart'); // Refresh cart after update
      return response.data.data.cartItem;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update cart item');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Remove item from cart
  async removeCartItem({ commit, dispatch }, id) {
    try {
      commit('SET_LOADING', true);
      await api.delete(`/cart/${id}`);
      await dispatch('fetchCart'); // Refresh cart after removal
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to remove cart item');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Clear entire cart
  async clearCart({ commit }) {
    try {
      commit('SET_LOADING', true);
      await api.delete('/cart');
      commit('SET_CART', null);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to clear cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Apply promotion code
  async applyPromotion({ commit, dispatch }, code) {
    try {
      commit('SET_LOADING', true);
      const response = await api.post('/cart/promotion', { code });
      await dispatch('fetchCart'); // Refresh cart with applied promotion
      return response.data.data.promotion;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to apply promotion code');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Remove promotion code
  async removePromotion({ commit, dispatch }) {
    try {
      commit('SET_LOADING', true);
      await api.delete('/cart/promotion');
      await dispatch('fetchCart'); // Refresh cart without promotion
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to remove promotion code');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Set special instructions for the order
  async setSpecialInstructions({ commit, dispatch }, instructions) {
    try {
      commit('SET_LOADING', true);
      await api.post('/cart/instructions', { instructions });
      await dispatch('fetchCart'); // Refresh cart with instructions
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to set instructions');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Set delivery address
  async setDeliveryAddress({ commit, dispatch }, addressId) {
    try {
      commit('SET_LOADING', true);
      await api.post('/cart/address', { addressId });
      await dispatch('fetchCart'); // Refresh cart with delivery address
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to set delivery address');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Schedule delivery
  async scheduleDelivery({ commit, dispatch }, scheduledTime) {
    try {
      commit('SET_LOADING', true);
      await api.post('/cart/schedule', { scheduledTime });
      await dispatch('fetchCart'); // Refresh cart with scheduled delivery
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to schedule delivery');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Cancel scheduled delivery
  async cancelScheduledDelivery({ commit, dispatch }) {
    try {
      commit('SET_LOADING', true);
      await api.delete('/cart/schedule');
      await dispatch('fetchCart'); // Refresh cart without scheduled delivery
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to cancel scheduled delivery');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

// Mutations
const mutations = {
  SET_CART(state, cart) {
    state.cart = cart;
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  CLEAR_ERROR(state) {
    state.error = null;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
