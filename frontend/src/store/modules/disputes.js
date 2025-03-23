import axios from 'axios';

const state = {
  disputes: [],
  total: 0,
  loading: false,
  error: null
};

const mutations = {
  SET_DISPUTES(state, { disputes, total }) {
    state.disputes = disputes;
    state.total = total;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  UPDATE_DISPUTE(state, updatedDispute) {
    const index = state.disputes.findIndex(d => d.id === updatedDispute.id);
    if (index !== -1) {
      state.disputes[index] = updatedDispute;
    }
  },
  ADD_DISPUTE(state, dispute) {
    state.disputes.unshift(dispute);
    state.total++;
  }
};

const actions = {
  async fetchDisputes({ commit }, params) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/api/admin/disputes', { params });
      commit('SET_DISPUTES', {
        disputes: response.data.disputes,
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

  async fetchDisputeByOrder({ commit }, orderId) {
    try {
      const response = await axios.get(`/api/admin/orders/${orderId}/dispute`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async createDispute({ commit }, payload) {
    try {
      const response = await axios.post('/api/admin/disputes', payload);
      commit('ADD_DISPUTE', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async approveDispute({ commit }, { disputeId }) {
    try {
      const response = await axios.post(`/api/admin/disputes/${disputeId}/approve`);
      commit('UPDATE_DISPUTE', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async rejectDispute({ commit }, { disputeId, reason }) {
    try {
      const response = await axios.post(`/api/admin/disputes/${disputeId}/reject`, { reason });
      commit('UPDATE_DISPUTE', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  }
};

const getters = {
  pendingDisputesCount: (state) => {
    return state.disputes.filter(dispute => dispute.status === 'pending').length;
  },
  getDisputeByOrderId: (state) => (orderId) => {
    return state.disputes.find(dispute => dispute.orderId === orderId);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};