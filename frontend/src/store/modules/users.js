import adminService from '@/services/admin.service';

export const state = {
  users: [],
  totalUsers: 0,
  currentPage: 1,
  totalPages: 0,
  loading: false,
  error: null,
  selectedUser: null,
  filters: {
    search: '',
    role: null,
    status: null
  }
};

export const mutations = {
  SET_USERS(state, { users, totalResults, currentPage, totalPages }) {
    state.users = users;
    state.totalUsers = totalResults;
    state.currentPage = currentPage;
    state.totalPages = totalPages;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_SELECTED_USER(state, user) {
    state.selectedUser = user;
  },
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters };
  },
  UPDATE_USER_IN_LIST(state, updatedUser) {
    const index = state.users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      state.users.splice(index, 1, updatedUser);
    }
  }
};

export const actions = {
  async fetchUsers({ commit, state }, { page = 1, limit = 20 } = {}) {
    try {
      commit('SET_LOADING', true);
      const params = {
        page,
        limit,
        ...state.filters
      };
      const response = await adminService.getUsers(params);
      commit('SET_USERS', {
        users: response.data.users,
        totalResults: response.data.totalResults,
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      commit('SET_ERROR', error.message);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchUserById({ commit }, id) {
    try {
      commit('SET_LOADING', true);
      const response = await adminService.getUserById(id);
      commit('SET_SELECTED_USER', response.data.user);
      return response.data.user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createUser({ commit, dispatch }, userData) {
    try {
      commit('SET_LOADING', true);
      await adminService.createUser(userData);
      dispatch('fetchUsers'); // Refresh user list
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateUser({ commit }, { id, userData }) {
    try {
      commit('SET_LOADING', true);
      const response = await adminService.updateUser(id, userData);
      commit('UPDATE_USER_IN_LIST', response.data.user);
      return response.data.user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateUserStatus({ commit }, { id, status, reason }) {
    try {
      commit('SET_LOADING', true);
      const response = await adminService.updateUserStatus(id, status, reason);
      commit('UPDATE_USER_IN_LIST', response.data.user);
      return response.data.user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setFilters({ commit, dispatch }, filters) {
    commit('SET_FILTERS', filters);
    dispatch('fetchUsers', { page: 1 }); // Reset to first page with new filters
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};