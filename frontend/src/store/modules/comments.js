import axios from 'axios';

const state = {
  comments: [],
  loading: false,
  error: null,
  totalComments: 0,
  currentPage: 1,
  itemsPerPage: 10,
  sortBy: 'date',
  sortOrder: 'desc',
  filterStatus: 'all' // all, pending, approved, rejected
};

const getters = {
  getComments: state => state.comments,
  isLoading: state => state.loading,
  getError: state => state.error,
  getTotalPages: state => Math.ceil(state.totalComments / state.itemsPerPage),
  getCurrentPage: state => state.currentPage,
  getSortBy: state => state.sortBy,
  getSortOrder: state => state.sortOrder,
  getFilterStatus: state => state.filterStatus
};

const actions = {
  async fetchComments({ commit, state }, restaurantId) {
    try {
      commit('SET_LOADING', true);
      const { data } = await axios.get(`/api/restaurants/${restaurantId}/comments`, {
        params: {
          page: state.currentPage,
          limit: state.itemsPerPage,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          status: state.filterStatus
        }
      });
      commit('SET_COMMENTS', data.comments);
      commit('SET_TOTAL_COMMENTS', data.total);
    } catch (error) {
      commit('SET_ERROR', error.message);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async addComment({ commit }, { restaurantId, content }) {
    try {
      commit('SET_LOADING', true);
      const { data } = await axios.post(`/api/restaurants/${restaurantId}/comments`, { content });
      commit('ADD_COMMENT', data);
      return data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async replyToComment({ commit }, { restaurantId, commentId, content }) {
    try {
      commit('SET_LOADING', true);
      const { data } = await axios.post(`/api/restaurants/${restaurantId}/comments/${commentId}/reply`, { content });
      commit('UPDATE_COMMENT', { id: commentId, updates: data });
      return data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async moderateComment({ commit }, { restaurantId, commentId, status }) {
    try {
      commit('SET_LOADING', true);
      const { data } = await axios.patch(`/api/restaurants/${restaurantId}/comments/${commentId}/moderate`, { status });
      commit('UPDATE_COMMENT', { id: commentId, updates: data });
      return data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  updateSortAndFilter({ commit, dispatch }, { sortBy, sortOrder, filterStatus, restaurantId }) {
    commit('SET_SORT_BY', sortBy);
    commit('SET_SORT_ORDER', sortOrder);
    commit('SET_FILTER_STATUS', filterStatus);
    commit('SET_CURRENT_PAGE', 1);
    dispatch('fetchComments', restaurantId);
  },

  setPage({ commit, dispatch }, { page, restaurantId }) {
    commit('SET_CURRENT_PAGE', page);
    dispatch('fetchComments', restaurantId);
  }
};

const mutations = {
  SET_COMMENTS(state, comments) {
    state.comments = comments;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_TOTAL_COMMENTS(state, total) {
    state.totalComments = total;
  },
  SET_CURRENT_PAGE(state, page) {
    state.currentPage = page;
  },
  SET_SORT_BY(state, sortBy) {
    state.sortBy = sortBy;
  },
  SET_SORT_ORDER(state, sortOrder) {
    state.sortOrder = sortOrder;
  },
  SET_FILTER_STATUS(state, status) {
    state.filterStatus = status;
  },
  ADD_COMMENT(state, comment) {
    state.comments.unshift(comment);
    state.totalComments++;
  },
  UPDATE_COMMENT(state, { id, updates }) {
    const index = state.comments.findIndex(comment => comment.id === id);
    if (index !== -1) {
      state.comments[index] = { ...state.comments[index], ...updates };
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};