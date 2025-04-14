import { createStore } from 'vuex';
import { useStore as baseUseStore } from 'vuex';
import category from './modules/category';
import product from './modules/product';
import user from './modules/user';
import users from './modules/users';
import page from './modules/page';
import notifications from './modules/notifications';
import cart from './modules/cart';
import orders from './modules/orders';
import ui from './modules/ui';
import admin from './modules/admin';
import restaurants from './modules/restaurants';
import favorites from './modules/favorites';

const store = createStore({
  modules: {
    category,
    product,
    user,
    users,
    notifications,
    page,
    cart,
    orders,
    ui,
    admin,
    restaurants,
    favorites,
  },
  state: {
    // Root state if needed
    connectionError: false,
    errorMessage: null,
    isBackendAvailable: true
  },
  mutations: {
    // Root mutations if needed
    SET_CONNECTION_ERROR(state, status) {
      state.connectionError = status;
      state.isBackendAvailable = !status;
    },
    SET_ERROR(state, message) {
      state.errorMessage = message;
    },
    CLEAR_ERROR(state) {
      state.errorMessage = null;
    }
  },
  actions: {
    // Root actions if needed
    initWebSocket({ commit }) {
      // Initialize websocket connection
      console.log('Initializing main WebSocket connection');
    },
    setConnectionError({ commit }, status) {
      commit('SET_CONNECTION_ERROR', status);
    },
    setError({ commit }, message) {
      commit('SET_ERROR', message);
    },
    clearError({ commit }) {
      commit('CLEAR_ERROR');
    },
    // New action to check if backend is available
    async checkBackendConnection({ commit }) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        // Simple health check endpoint
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Short timeout for health check
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          commit('SET_CONNECTION_ERROR', false);
          return true;
        } else {
          commit('SET_CONNECTION_ERROR', true);
          return false;
        }
      } catch (error) {
        console.warn('Backend connection check failed:', error.message);
        commit('SET_CONNECTION_ERROR', true);
        return false;
      }
    }
  },
  getters: {
    isBackendAvailable: state => state.isBackendAvailable,
    hasConnectionError: state => state.connectionError,
    errorMessage: state => state.errorMessage
  }
});

// Create a type-safe composable
export const useStore = () => {
  return baseUseStore();
};

export default store;
