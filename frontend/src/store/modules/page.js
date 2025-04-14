import pageService from '@/services/page.service';

const state = {
  pages: [],
  currentPage: null,
  loading: false,
  error: null
};

const getters = {
  allPages: state => state.pages,
  currentPage: state => state.currentPage,
  isLoading: state => state.loading,
  error: state => state.error
};

const actions = {
  async fetchPages({ commit }) {
    try {
      commit('setLoading', true);
      const response = await pageService.getPages();
      commit('setPages', response.data.items);
      return response.data.items;
    } catch (error) {
      commit('setError', error.message);
      return [];
    } finally {
      commit('setLoading', false);
    }
  },

  async fetchPageBySlug({ commit }, slug) {
    try {
      commit('setLoading', true);
      const response = await pageService.getPageBySlug(slug);
      commit('setCurrentPage', response.data.item);
      return response.data.item;
    } catch (error) {
      commit('setError', error.message);
      return null;
    } finally {
      commit('setLoading', false);
    }
  }
};

const mutations = {
  setPages(state, pages) {
    state.pages = pages;
    state.error = null;
  },
  setCurrentPage(state, page) {
    state.currentPage = page;
    state.error = null;
  },
  setLoading(state, loading) {
    state.loading = loading;
  },
  setError(state, error) {
    state.error = error;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};