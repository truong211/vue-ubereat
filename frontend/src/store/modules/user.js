/**
 * User Store Module
 * Manages user-related data and actions
 */

import axios from 'axios'
import { API_URL } from '@/config'

// Types for TypeScript support
export interface DeliveryAddress {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  provider?: string;
  cardNumber?: string;
  cardName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  brand?: string;
  isDefault: boolean;
  email?: string;
  phone?: string;
}

export interface Voucher {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  restrictions?: string[];
}

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
      return state.addresses.find(address => address.isDefault) || null;
    },
    
    otherAddresses: (state) => {
      return state.addresses.filter(address => !address.isDefault);
    },
    
    // Payment method getters
    defaultPaymentMethod: (state) => {
      return state.paymentMethods.find(method => method.isDefault) || null;
    },
    
    cardPaymentMethods: (state) => {
      return state.paymentMethods.filter(method => 
        method.type === 'card' || method.type === 'credit_card' || method.type === 'debit_card'
      );
    },
    
    eWalletPaymentMethods: (state) => {
      return state.paymentMethods.filter(method => method.type === 'ewallet');
    },
    
    // Voucher getters
    activeVouchers: (state) => {
      const now = new Date();
      return state.vouchers.filter(voucher => {
        const endDate = new Date(voucher.endDate);
        return endDate >= now;
      });
    },
    
    expiredVouchers: (state) => {
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
      state.addresses = addresses;
    },
    
    ADD_ADDRESS(state, address) {
      // If the new address is default, unset default on all others
      if (address.isDefault) {
        state.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      state.addresses.push(address);
    },
    
    UPDATE_ADDRESS(state, updatedAddress) {
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
      state.addresses = state.addresses.filter(addr => addr.id !== addressId);
    },
    
    SET_DEFAULT_ADDRESS(state, addressId) {
      state.addresses.forEach(address => {
        address.isDefault = address.id === addressId;
      });
    },
    
    SET_PAYMENT_METHODS(state, methods) {
      state.paymentMethods = methods;
    },
    
    ADD_PAYMENT_METHOD(state, method) {
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
      state.paymentMethods = state.paymentMethods.filter(m => m.id !== methodId);
    },
    
    SET_DEFAULT_PAYMENT_METHOD(state, { methodId, type }) {
      state.paymentMethods.forEach(method => {
        if (method.type === type) {
          method.isDefault = method.id === methodId;
        }
      });
    },

    // Voucher mutations
    SET_VOUCHERS(state, vouchers) {
      state.vouchers = vouchers;
    },
    
    ADD_VOUCHER(state, voucher) {
      state.vouchers.push(voucher);
    },
    
    REMOVE_VOUCHER(state, voucherId) {
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
    }
  },
  
  actions: {
    // Profile actions
    async fetchProfile({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.get(`${API_URL}/api/user/profile`);
        commit('SET_PROFILE', response.data);
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
        const response = await axios.put(`${API_URL}/api/user/profile`, profileData);
        commit('SET_PROFILE', response.data);
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
        const response = await axios.get(`${API_URL}/api/user/addresses`);
        commit('SET_ADDRESSES', response.data);
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
        const response = await axios.post(`${API_URL}/api/user/addresses`, addressData);
        commit('ADD_ADDRESS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to add address');
        throw error;
      } finally {
        commit('SET_LOADING_ADDRESSES', false);
      }
    },
    
    async updateAddress({ commit }, { id, addressData }) {
      commit('SET_LOADING_ADDRESSES', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await axios.put(`${API_URL}/api/user/addresses/${id}`, addressData);
        commit('UPDATE_ADDRESS', response.data);
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
        await axios.delete(`${API_URL}/api/user/addresses/${addressId}`);
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
        await axios.put(`${API_URL}/api/user/addresses/${addressId}/default`);
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
        const response = await axios.get(`${API_URL}/api/user/payment-methods`);
        commit('SET_PAYMENT_METHODS', response.data);
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
        const response = await axios.post(`${API_URL}/api/user/payment-methods`, methodData);
        commit('ADD_PAYMENT_METHOD', response.data);
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
        const response = await axios.put(`${API_URL}/api/user/payment-methods/${id}`, methodData);
        commit('UPDATE_PAYMENT_METHOD', response.data);
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
        await axios.delete(`${API_URL}/api/user/payment-methods/${methodId}`);
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
        await axios.put(`${API_URL}/api/user/payment-methods/${methodId}/default`);
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
        const response = await axios.get(`${API_URL}/api/user/vouchers`);
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
        const response = await axios.post(`${API_URL}/api/user/vouchers`, { code });
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
        await axios.delete(`${API_URL}/api/user/vouchers/${voucherId}`);
        commit('REMOVE_VOUCHER', voucherId);
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to remove voucher');
        throw error;
      } finally {
        commit('SET_LOADING_VOUCHERS', false);
      }
    }
  }
} 