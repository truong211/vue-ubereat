import { apiClient } from '@/services/api.service'

export default {
  namespaced: true,
  
  state: {
    categories: [],
    loading: false,
    error: null,
    selectedCategory: null,
    items: []
  },

  getters: {
    allCategories: (state) => state.categories,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getSelectedCategory: (state) => state.selectedCategory
  },

  mutations: {
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_SELECTED_CATEGORY(state, category) {
      state.selectedCategory = category
    }
  },

  actions: {
    async fetchCategories({ commit }) {
      try {
        commit('SET_LOADING', true)
        const response = await apiClient.get('/api/categories')
        const categories = response.data?.items || []
        commit('SET_CATEGORIES', categories)
        commit('SET_ERROR', null)
        return categories
      } catch (error) {
        const errorMessage = error.message || 'Failed to fetch categories'
        commit('SET_ERROR', errorMessage)
        console.error('Error fetching categories:', error)
        return []
      } finally {
        commit('SET_LOADING', false)
      }
    },

    selectCategory({ commit }, category) {
      commit('SET_SELECTED_CATEGORY', category)
    }
  }
}
