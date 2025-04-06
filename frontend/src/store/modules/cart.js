import cartService from '@/services/cart.service';
import { USE_MOCK_DATA } from '@/config';
import axios from 'axios';

// Create an api instance for consistent usage
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Initial state
const state = {
  items: [],
  loading: false,
  error: null,
  subtotal: 0,
  deliveryFee: 0,
  tax: 0,
  total: 0
};

// Getters
const getters = {
  cartItems: state => state.items,
  cartItemsCount: state => state.items.reduce((count, item) => count + item.quantity, 0),
  cartSubtotal: state => state.subtotal,
  cartDeliveryFee: state => state.deliveryFee,
  cartTax: state => state.tax,
  cartTotal: state => state.total,
  isCartEmpty: state => state.items.length === 0,
  isLoading: state => state.loading,
  hasError: state => state.error !== null,
  getError: state => state.error
};

// Actions
const actions = {
  // Fetch the user's cart
  async fetchCart({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await cartService.getCartItems();
      console.log('Cart response:', response.data);
      
      if (!response.data || !response.data.data) {
        commit('SET_CART_ITEMS', []);
        commit('UPDATE_CART_TOTALS', {
          subtotal: 0,
          deliveryFee: 0,
          tax: 0,
          total: 0
        });
        return { items: [] };
      }
      
      const cartData = response.data.data;
      
      // Set cart items
      commit('SET_CART_ITEMS', cartData.items || []);
      
      // Update cart totals
      commit('UPDATE_CART_TOTALS', {
        subtotal: cartData.subtotal || 0,
        deliveryFee: cartData.deliveryFee || 0,
        tax: cartData.taxAmount || 0,
        total: cartData.total || 0
      });
      
      return cartData;
    } catch (error) {
      console.error('Error fetching cart:', error);
      commit('SET_ERROR', 'Failed to load cart items');
      commit('SET_CART_ITEMS', []);
      commit('UPDATE_CART_TOTALS', {
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0
      });
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Add item to cart
  async addToCart({ commit, dispatch }, { productId, quantity = 1, options = null }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await cartService.addToCart(productId, quantity, options);
      // Refresh cart
      return dispatch('fetchCart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      commit('SET_ERROR', 'Failed to add item to cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update cart item
  async updateCartItem({ commit, dispatch }, { itemId, quantity }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await cartService.updateQuantity(itemId, quantity);
      // Refresh cart
      return dispatch('fetchCart');
    } catch (error) {
      console.error('Error updating cart item:', error);
      commit('SET_ERROR', 'Failed to update cart item');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Remove item from cart
  async removeFromCart({ commit, dispatch }, itemId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await cartService.removeFromCart(itemId);
      // Refresh cart
      return dispatch('fetchCart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      commit('SET_ERROR', 'Failed to remove item from cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Clear entire cart
  async clearCart({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await cartService.clearCart();
      commit('CLEAR_CART');
    } catch (error) {
      console.error('Error clearing cart:', error);
      commit('SET_ERROR', 'Failed to clear cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Validate cart
  async validateCart({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await cartService.validateCart();
      return response.data;
    } catch (error) {
      console.error('Error validating cart:', error);
      commit('SET_ERROR', 'Failed to validate cart');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Apply promotion code
  async applyPromotion({ commit, dispatch }, code) {
    try {
      commit('SET_LOADING', true);
      const response = await api.post('/api/cart/promotion', { code });
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
      await api.delete('/api/cart/promotion');
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
      await api.post('/api/cart/instructions', { instructions });
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
      await api.post('/api/cart/address', { addressId });
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
      await api.post('/api/cart/schedule', { scheduledTime });
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
      await api.delete('/api/cart/schedule');
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
  SET_CART_ITEMS(state, items) {
    state.items = items;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  UPDATE_CART_TOTALS(state, { subtotal, deliveryFee, tax, total }) {
    state.subtotal = subtotal;
    state.deliveryFee = deliveryFee;
    state.tax = tax;
    state.total = total;
  },
  CLEAR_CART(state) {
    state.items = [];
    state.subtotal = 0;
    state.deliveryFee = 0;
    state.tax = 0;
    state.total = 0;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
