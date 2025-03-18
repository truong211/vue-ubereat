import axios from 'axios';
import { API_URL } from '@/config';

export const profileModule = {
  namespaced: true,

  state: {
    addresses: [],
    orderHistory: [],
    favorites: {
      restaurants: [],
      items: []
    },
    isLoading: false,
    error: null
  },

  mutations: {
    SET_ADDRESSES(state, addresses) {
      state.addresses = addresses;
    },
    ADD_ADDRESS(state, address) {
      state.addresses.push(address);
    },
    UPDATE_ADDRESS(state, updatedAddress) {
      const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id);
      if (index !== -1) {
        state.addresses.splice(index, 1, updatedAddress);
      }
    },
    REMOVE_ADDRESS(state, addressId) {
      state.addresses = state.addresses.filter(addr => addr.id !== addressId);
    },
    SET_ORDER_HISTORY(state, orders) {
      state.orderHistory = orders;
    },
    SET_FAVORITES(state, { type, items }) {
      state.favorites[type] = items;
    },
    ADD_FAVORITE(state, { type, item }) {
      state.favorites[type].push(item);
    },
    REMOVE_FAVORITE(state, { type, itemId }) {
      state.favorites[type] = state.favorites[type].filter(item => item.id !== itemId);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },

  actions: {
    // Address Management
    async fetchAddresses({ commit }) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.get(`${API_URL}/api/user/addresses`);
        commit('SET_ADDRESSES', response.data);
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async addAddress({ commit }, addressData) {
      try {
        const response = await axios.post(`${API_URL}/api/user/addresses`, addressData);
        commit('ADD_ADDRESS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    async updateAddress({ commit }, { id, ...addressData }) {
      try {
        const response = await axios.put(`${API_URL}/api/user/addresses/${id}`, addressData);
        commit('UPDATE_ADDRESS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    async deleteAddress({ commit }, addressId) {
      try {
        await axios.delete(`${API_URL}/api/user/addresses/${addressId}`);
        commit('REMOVE_ADDRESS', addressId);
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    async setDefaultAddress({ dispatch }, addressId) {
      try {
        await axios.put(`${API_URL}/api/user/addresses/${addressId}/default`);
        await dispatch('fetchAddresses'); // Refresh addresses to get updated default status
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    // Order History
    async fetchOrderHistory({ commit }, params = {}) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.get(`${API_URL}/api/user/orders`, { params });
        commit('SET_ORDER_HISTORY', response.data);
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    // Favorites Management
    async fetchFavorites({ commit }, type = 'restaurants') {
      commit('SET_LOADING', true);
      try {
        const response = await axios.get(`${API_URL}/api/user/favorites/${type}`);
        commit('SET_FAVORITES', { type, items: response.data });
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async addToFavorites({ commit }, { type, itemId }) {
      try {
        const response = await axios.post(`${API_URL}/api/user/favorites/${type}/${itemId}`);
        commit('ADD_FAVORITE', { type, item: response.data });
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    async removeFromFavorites({ commit }, { type, itemId }) {
      try {
        await axios.delete(`${API_URL}/api/user/favorites/${type}/${itemId}`);
        commit('REMOVE_FAVORITE', { type, itemId });
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      }
    }
  },

  getters: {
    defaultAddress: state => state.addresses.find(addr => addr.isDefault),
    getAddressById: state => id => state.addresses.find(addr => addr.id === id),
    sortedOrderHistory: state => [...state.orderHistory].sort((a, b) => new Date(b.date) - new Date(a.date)),
    favoriteRestaurants: state => state.favorites.restaurants,
    favoriteItems: state => state.favorites.items
  }
};

export default profileModule;