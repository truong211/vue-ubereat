/**
 * User Store Module
 * Manages user-related data and actions
 */

import axios from 'axios'
import { API_URL } from '@/config'

export default {
  namespaced: true,
  
  state: {
    // User profile
    profile: null,
    
    // Delivery addresses
    addresses: [],
    
    // Payment methods
    paymentMethods: [],
    
    // Vouchers/Discount codes
    vouchers: [],
    
    // Loading states
    loading: false,
    loadingAddresses: false,
    loadingPaymentMethods: false,
    loadingVouchers: false,
    
    // Error state
    error: null
  },
  
  getters: {
    // Profile getters
    fullName: (state) => {
      if (!state.profile) return '';
      return `${state.profile.firstName} ${state.profile.lastName}`;
    },
    
    // Address getters
    defaultAddress: (state) => {
      return Array.isArray(state.addresses) 
        ? state.addresses.find(address => address.isDefault) || null
        : null;
    },
    
    otherAddresses: (state) => {
      return Array.isArray(state.addresses)
        ? state.addresses.filter(address => !address.isDefault)
        : [];
    },
    
    // Payment method getters
    defaultPaymentMethod: (state) => {
      return Array.isArray(state.paymentMethods) 
        ? state.paymentMethods.find(method => method.isDefault) || null
        : null;
    },
    
    cardPaymentMethods: (state) => {
      return Array.isArray(state.paymentMethods)
        ? state.paymentMethods.filter(method => 
            method.type === 'card' || method.type === 'credit_card' || method.type === 'debit_card'
          )
        : [];
    },
    
    eWalletPaymentMethods: (state) => {
      return Array.isArray(state.paymentMethods)
        ? state.paymentMethods.filter(method => method.type === 'ewallet')
        : [];
    },
    
    // Voucher getters
    activeVouchers: (state) => {
      if (!Array.isArray(state.vouchers)) return [];
      
      const now = new Date();
      return state.vouchers.filter(voucher => {
        const endDate = new Date(voucher.endDate);
        return endDate >= now;
      });
    },
    
    expiredVouchers: (state) => {
      if (!Array.isArray(state.vouchers)) return [];
      
      const now = new Date();
      return state.vouchers.filter(voucher => {
        const endDate = new Date(voucher.endDate);
        return endDate < now;
      });
    }
  },
  
  mutations: {
    SET_PROFILE(state, profile) {
      state.profile = profile;
    },
    
    SET_ADDRESSES(state, addresses) {
      state.addresses = Array.isArray(addresses) ? addresses : [];
    },
    
    ADD_ADDRESS(state, address) {
      // Ensure addresses is an array
      if (!Array.isArray(state.addresses)) {
        state.addresses = [];
      }
      
      // If the new address is default, unset default on all others
      if (address.isDefault) {
        state.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      state.addresses.push(address);
    },
    
    UPDATE_ADDRESS(state, updatedAddress) {
      // Ensure addresses is an array
      if (!Array.isArray(state.addresses)) {
        state.addresses = [];
        return;
      }
      
      const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id);
      if (index !== -1) {
        // If the updated address is default, unset default on all others
        if (updatedAddress.isDefault) {
          state.addresses.forEach(addr => {
            addr.isDefault = false;
          });
        }
        state.addresses.splice(index, 1, updatedAddress);
      }
    },
    
    REMOVE_ADDRESS(state, addressId) {
      if (!Array.isArray(state.addresses)) {
        state.addresses = [];
        return;
      }
      state.addresses = state.addresses.filter(addr => addr.id !== addressId);
    },
    
    SET_DEFAULT_ADDRESS(state, addressId) {
      if (!Array.isArray(state.addresses)) {
        state.addresses = [];
        return;
      }
      state.addresses.forEach(address => {
        address.isDefault = address.id === addressId;
      });
    },
    
    SET_PAYMENT_METHODS(state, methods) {
      state.paymentMethods = Array.isArray(methods) ? methods : [];
    },
    
    ADD_PAYMENT_METHOD(state, method) {
      // Ensure paymentMethods is an array
      if (!Array.isArray(state.paymentMethods)) {
        state.paymentMethods = [];
      }
      
      // If the new method is default, unset default on all others of same type
      if (method.isDefault) {
        state.paymentMethods.forEach(m => {
          if (m.type === method.type) {
            m.isDefault = false;
          }
        });
      }
      state.paymentMethods.push(method);
    },
    
    UPDATE_PAYMENT_METHOD(state, updatedMethod) {
      // Ensure paymentMethods is an array
      if (!Array.isArray(state.paymentMethods)) {
        state.paymentMethods = [];
        return;
      }
      
      const index = state.paymentMethods.findIndex(m => m.id === updatedMethod.id);
      if (index !== -1) {
        // If the updated method is default, unset default on all others of same type
        if (updatedMethod.isDefault) {
          state.paymentMethods.forEach(m => {
            if (m.type === updatedMethod.type) {
              m.isDefault = false;
            }
          });
        }
        state.paymentMethods.splice(index, 1, updatedMethod);
      }
    },
    
    REMOVE_PAYMENT_METHOD(state, methodId) {
      if (!Array.isArray(state.paymentMethods)) {
        state.paymentMethods = [];
        return;
      }
      state.paymentMethods = state.paymentMethods.filter(m => m.id !== methodId);
    },
    
    SET_DEFAULT_PAYMENT_METHOD(state, { methodId, type }) {
      if (!Array.isArray(state.paymentMethods)) {
        state.paymentMethods = [];
        return;
      }
      state.paymentMethods.forEach(method => {
        if (method.type === type) {
          method.isDefault = method.id === methodId;
        }
      });
    },

    // Voucher mutations
    SET_VOUCHERS(state, vouchers) {
      state.vouchers = Array.isArray(vouchers) ? vouchers : [];
    },
    
    ADD_VOUCHER(state, voucher) {
      if (!Array.isArray(state.vouchers)) {
        state.vouchers = [];
      }
      state.vouchers.push(voucher);
    },
    
    REMOVE_VOUCHER(state, voucherId) {
      if (!Array.isArray(state.vouchers)) {
        state.vouchers = [];
        return;
      }
      state.vouchers = state.vouchers.filter(v => v.id !== voucherId);
    },
    
    // Loading state mutations
    SET_LOADING(state, isLoading) {
      state.loading = isLoading;
    },
    
    SET_LOADING_ADDRESSES(state, isLoading) {
      state.loadingAddresses = isLoading;
    },
    
    SET_LOADING_PAYMENT_METHODS(state, isLoading) {
      state.loadingPaymentMethods = isLoading;
    },
    
    SET_LOADING_VOUCHERS(state, isLoading) {
      state.loadingVouchers = isLoading;
    },
    
    // Error mutation
    SET_ERROR(state, error) {
      state.error = error;
    },
    
    UPDATE_AVATAR(state, avatarUrl) {
      if (state.profile) {
        state.profile = {
          ...state.profile,
          avatar: avatarUrl
        };
      }
    }
  },
  
  actions: {
    // Profile actions
    async fetchProfile({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.get('/api/users/profile');
        commit('SET_PROFILE', response.data?.data?.user || response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch profile');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async updateProfile({ commit }, profileData) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.patch('/api/users/profile', profileData);
        commit('SET_PROFILE', response.data?.data?.user || response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update profile');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Address actions
    async fetchAddresses({ commit }) {
      commit('SET_LOADING_ADDRESSES', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.get('/api/users/addresses');
        commit('SET_ADDRESSES', response.data?.data?.addresses || []);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch addresses');
        throw error;
      } finally {
        commit('SET_LOADING_ADDRESSES', false);
      }
    },
    
    async addAddress({ commit }, addressData) {
      commit('SET_LOADING_ADDRESSES', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.post('/api/users/addresses', addressData);
        commit('ADD_ADDRESS', response.data?.data?.address || response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to add address');
        throw error;
      } finally {
        commit('SET_LOADING_ADDRESSES', false);
      }
    },
    
    async updateAddress({ commit }, payload) {
      // Accept both { id, addressData } and { id, ...fields }
      const { id, addressData, ...rest } = payload;
      const dataToSend = addressData || rest; // Prefer explicit addressData if provided

      commit('SET_LOADING_ADDRESSES', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.put(`/api/users/addresses/${id}`, dataToSend);
        commit('UPDATE_ADDRESS', response.data?.data?.address || response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update address');
        throw error;
      } finally {
        commit('SET_LOADING_ADDRESSES', false);
      }
    },
    
    async deleteAddress({ commit }, addressId) {
      commit('SET_LOADING_ADDRESSES', true);
      commit('SET_ERROR', null);
      
      try {
        await axios.delete(`/api/users/addresses/${addressId}`);
        commit('REMOVE_ADDRESS', addressId);
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to delete address');
        throw error;
      } finally {
        commit('SET_LOADING_ADDRESSES', false);
      }
    },
    
    async setDefaultAddress({ commit }, addressId) {
      commit('SET_LOADING_ADDRESSES', true);
      commit('SET_ERROR', null);
      
      try {
        await axios.put(`/api/users/addresses/${addressId}/default`);
        commit('SET_DEFAULT_ADDRESS', addressId);
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to set default address');
        throw error;
      } finally {
        commit('SET_LOADING_ADDRESSES', false);
      }
    },
    
    // Payment method actions
    async fetchPaymentMethods({ commit }) {
      commit('SET_LOADING_PAYMENT_METHODS', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.get('/api/users/payment-methods');
        commit('SET_PAYMENT_METHODS', response.data?.data?.paymentMethods || []);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch payment methods');
        throw error;
      } finally {
        commit('SET_LOADING_PAYMENT_METHODS', false);
      }
    },
    
    async addPaymentMethod({ commit }, methodData) {
      commit('SET_LOADING_PAYMENT_METHODS', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.post('/api/users/payment-methods', methodData);
        commit('ADD_PAYMENT_METHOD', response.data?.data?.paymentMethod || response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to add payment method');
        throw error;
      } finally {
        commit('SET_LOADING_PAYMENT_METHODS', false);
      }
    },
    
    async updatePaymentMethod({ commit }, { id, methodData }) {
      commit('SET_LOADING_PAYMENT_METHODS', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.put(`/api/users/payment-methods/${id}`, methodData);
        commit('UPDATE_PAYMENT_METHOD', response.data?.data?.paymentMethod || response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update payment method');
        throw error;
      } finally {
        commit('SET_LOADING_PAYMENT_METHODS', false);
      }
    },
    
    async deletePaymentMethod({ commit }, methodId) {
      commit('SET_LOADING_PAYMENT_METHODS', true);
      commit('SET_ERROR', null);
      
      try {
        await axios.delete(`/api/users/payment-methods/${methodId}`);
        commit('REMOVE_PAYMENT_METHOD', methodId);
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to delete payment method');
        throw error;
      } finally {
        commit('SET_LOADING_PAYMENT_METHODS', false);
      }
    },
    
    async setDefaultPaymentMethod({ commit }, { methodId, type }) {
      commit('SET_LOADING_PAYMENT_METHODS', true);
      commit('SET_ERROR', null);
      
      try {
        await axios.put(`/api/users/payment-methods/${methodId}/default`);
        commit('SET_DEFAULT_PAYMENT_METHOD', { methodId, type });
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to set default payment method');
        throw error;
      } finally {
        commit('SET_LOADING_PAYMENT_METHODS', false);
      }
    },
    
    // Voucher actions
    async fetchVouchers({ commit }) {
      commit('SET_LOADING_VOUCHERS', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.get('/api/promotions');
        commit('SET_VOUCHERS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch vouchers');
        throw error;
      } finally {
        commit('SET_LOADING_VOUCHERS', false);
      }
    },
    
    async addVoucher({ commit }, code) {
      commit('SET_LOADING_VOUCHERS', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.post('/api/promotions/validate', { code });
        commit('ADD_VOUCHER', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to add voucher');
        throw error;
      } finally {
        commit('SET_LOADING_VOUCHERS', false);
      }
    },
    
    async removeVoucher({ commit }, voucherId) {
      commit('SET_LOADING_VOUCHERS', true);
      commit('SET_ERROR', null);
      
      try {
        await axios.delete(`/api/promotions/${voucherId}`);
        commit('REMOVE_VOUCHER', voucherId);
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to remove voucher');
        throw error;
      } finally {
        commit('SET_LOADING_VOUCHERS', false);
      }
    },
    
    // Avatar actions
    async updateAvatar({ commit }, avatarUrl) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        // Update the profile with the new avatar URL
        commit('UPDATE_AVATAR', avatarUrl);
        return avatarUrl;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update avatar');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Fix any remaining requests that might have duplicate api prefixes
    async fetchNotifications({ commit }) {
      commit('SET_LOADING_NOTIFICATIONS', true);
      commit('SET_ERROR', null);
      
      try {
        // This endpoint should be just /api/notifications - no api prefix duplication
        const response = await axios.get('/api/notifications');
        commit('SET_NOTIFICATIONS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch notifications');
        throw error;
      } finally {
        commit('SET_LOADING_NOTIFICATIONS', false);
      }
    },
    
    async getNotificationPreferences({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.get('/api/notifications/preferences');
        commit('SET_NOTIFICATION_PREFERENCES', response.data);
        return response.data;
      } catch (error) {
        console.error('Error getting notification preferences:', error);
        commit('SET_ERROR', error.message || 'Failed to get notification preferences');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async updateNotificationPreferences({ commit }, preferences) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.put('/api/notifications/preferences', preferences);
        commit('SET_NOTIFICATION_PREFERENCES', response.data);
        return response.data;
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        commit('SET_ERROR', error.message || 'Failed to update notification preferences');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  }
} 