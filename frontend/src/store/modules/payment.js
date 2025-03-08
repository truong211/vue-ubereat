import PaymentService from '@/services/payment.service';

const state = {
  availablePaymentMethods: [],
  savedPaymentMethods: [],
  selectedPaymentMethod: null,
  paymentStatus: null,
  paymentError: null,
  processingPayment: false,
  lastPaymentInfo: null
};

const getters = {
  getAvailablePaymentMethods: (state) => state.availablePaymentMethods,
  getSavedPaymentMethods: (state) => state.savedPaymentMethods,
  getSelectedPaymentMethod: (state) => state.selectedPaymentMethod,
  getPaymentStatus: (state) => state.paymentStatus,
  getPaymentError: (state) => state.paymentError,
  isProcessingPayment: (state) => state.processingPayment,
  getLastPaymentInfo: (state) => state.lastPaymentInfo
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};