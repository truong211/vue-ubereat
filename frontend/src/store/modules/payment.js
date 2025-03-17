import PaymentService from '@/services/payment.service';
import axios from 'axios';
import { API_URL } from '@/config';

const state = {
  availablePaymentMethods: [],
  savedPaymentMethods: [],
  selectedPaymentMethod: null,
  paymentStatus: null,
  paymentError: null,
  processingPayment: false,
  lastPaymentInfo: null,
  savedCards: [],
  lastPaymentError: null
};

const getters = {
  getAvailablePaymentMethods: (state) => state.availablePaymentMethods,
  getSavedPaymentMethods: (state) => state.savedPaymentMethods,
  getSelectedPaymentMethod: (state) => state.selectedPaymentMethod,
  getPaymentStatus: (state) => state.paymentStatus,
  getPaymentError: (state) => state.paymentError,
  isProcessingPayment: (state) => state.processingPayment,
  getLastPaymentInfo: (state) => state.lastPaymentInfo,
  getSavedCards: state => state.savedCards,
  isProcessing: state => state.processingPayment,
  getLastError: state => state.lastPaymentError
};

const mutations = {
  SET_AVAILABLE_PAYMENT_METHODS(state, methods) {
    state.availablePaymentMethods = methods;
  },
  SET_SAVED_PAYMENT_METHODS(state, methods) {
    state.savedPaymentMethods = methods;
  },
  SET_SELECTED_PAYMENT_METHOD(state, method) {
    state.selectedPaymentMethod = method;
  },
  SET_PAYMENT_STATUS(state, status) {
    state.paymentStatus = status;
  },
  SET_PAYMENT_ERROR(state, error) {
    state.paymentError = error;
  },
  SET_PROCESSING_PAYMENT(state, status) {
    state.processingPayment = status;
  },
  SET_LAST_PAYMENT_INFO(state, info) {
    state.lastPaymentInfo = info;
  },
  CLEAR_PAYMENT_STATE(state) {
    state.paymentStatus = null;
    state.paymentError = null;
    state.processingPayment = false;
  },
  SET_SAVED_CARDS(state, cards) {
    state.savedCards = cards;
  },
  ADD_SAVED_CARD(state, card) {
    state.savedCards.push(card);
  },
  REMOVE_SAVED_CARD(state, cardId) {
    state.savedCards = state.savedCards.filter(card => card.id !== cardId);
  },
  SET_PROCESSING(state, isProcessing) {
    state.processingPayment = isProcessing;
  },
  SET_PAYMENT_ERROR(state, error) {
    state.lastPaymentError = error;
  }
};

const actions = {
  async fetchPaymentMethods({ commit }) {
    try {
      const methods = await PaymentService.getPaymentMethods();
      commit('SET_AVAILABLE_PAYMENT_METHODS', methods);
      return methods;
    } catch (error) {
      commit('SET_PAYMENT_ERROR', error.message);
      throw error;
    }
  },

  async fetchSavedPaymentMethods({ commit }) {
    try {
      const methods = await PaymentService.getSavedPaymentMethods();
      commit('SET_SAVED_PAYMENT_METHODS', methods);
      return methods;
    } catch (error) {
      commit('SET_PAYMENT_ERROR', error.message);
      throw error;
    }
  },

  async processPayment({ commit }, { paymentMethod, orderData }) {
    commit('SET_PROCESSING_PAYMENT', true);
    commit('CLEAR_PAYMENT_STATE');

    try {
      let result;
      switch (paymentMethod) {
        case 'vnpay':
          result = await PaymentService.processVNPayPayment(orderData);
          break;
        case 'momo':
          result = await PaymentService.processMomoPayment(orderData);
          break;
        case 'zalopay':
          result = await PaymentService.processZaloPayment(orderData);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      commit('SET_PAYMENT_STATUS', result.status);
      commit('SET_LAST_PAYMENT_INFO', result);
      return result;
    } catch (error) {
      commit('SET_PAYMENT_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_PROCESSING_PAYMENT', false);
    }
  },

  async processRefund({ commit }, { orderId, refundData }) {
    try {
      const result = await PaymentService.processRefund(orderId, refundData);
      commit('SET_PAYMENT_STATUS', 'refunded');
      return result;
    } catch (error) {
      commit('SET_PAYMENT_ERROR', error.message);
      throw error;
    }
  },

  async savePaymentMethod({ commit }, paymentMethod) {
    try {
      const result = await PaymentService.savePaymentMethod(paymentMethod);
      await this.dispatch('payment/fetchSavedPaymentMethods');
      return result;
    } catch (error) {
      commit('SET_PAYMENT_ERROR', error.message);
      throw error;
    }
  },

  async deleteSavedPaymentMethod({ commit }, methodId) {
    try {
      await PaymentService.deleteSavedPaymentMethod(methodId);
      await this.dispatch('payment/fetchSavedPaymentMethods');
    } catch (error) {
      commit('SET_PAYMENT_ERROR', error.message);
      throw error;
    }
  },

  setSelectedPaymentMethod({ commit }, method) {
    commit('SET_SELECTED_PAYMENT_METHOD', method);
  },

  clearPaymentState({ commit }) {
    commit('CLEAR_PAYMENT_STATE');
  },

  async fetchSavedCards({ commit }) {
    try {
      const response = await axios.get(`${API_URL}/api/payment/saved-cards`);
      commit('SET_SAVED_CARDS', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching saved cards:', error);
      throw error;
    }
  },

  async deleteSavedCard({ commit }, cardId) {
    try {
      await axios.delete(`${API_URL}/api/payment/saved-cards/${cardId}`);
      commit('REMOVE_SAVED_CARD', cardId);
    } catch (error) {
      console.error('Error deleting saved card:', error);
      throw error;
    }
  },

  async processCardPayment({ commit }, { orderId, paymentDetails }) {
    commit('SET_PROCESSING', true);
    commit('SET_PAYMENT_ERROR', null);

    try {
      const response = await axios.post(`${API_URL}/api/payment/process`, {
        order_id: orderId,
        ...paymentDetails
      });

      return response.data;
    } catch (error) {
      console.error('Payment processing error:', error);
      commit('SET_PAYMENT_ERROR', error.response?.data?.message || 'Payment processing failed');
      throw error;
    } finally {
      commit('SET_PROCESSING', false);
    }
  },

  async processWalletPayment({ commit }, { orderId, provider, returnUrl }) {
    commit('SET_PROCESSING', true);
    commit('SET_PAYMENT_ERROR', null);

    try {
      const response = await axios.post(`${API_URL}/api/payment/${provider}/init`, {
        order_id: orderId,
        return_url: returnUrl
      });

      // For wallet payments (Momo, ZaloPay, VNPay), we expect a redirect URL
      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      }

      return response.data;
    } catch (error) {
      console.error('Payment initialization error:', error);
      commit('SET_PAYMENT_ERROR', error.response?.data?.message || 'Payment initialization failed');
      throw error;
    } finally {
      commit('SET_PROCESSING', false);
    }
  },

  async verifyPayment({ commit }, { provider, paymentId }) {
    try {
      const response = await axios.get(`${API_URL}/api/payment/${provider}/verify/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      commit('SET_PAYMENT_ERROR', error.response?.data?.message || 'Payment verification failed');
      throw error;
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};