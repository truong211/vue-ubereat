import axios from 'axios'

export default {
  namespaced: true,

  state: {
    categories: [],
    loading: false,
    error: null
  },

  mutations: {
    setCategories(state, categories) {
      state.categories = categories
    },
    addCategory(state, category) {
      state.categories.push(category)
    },
    updateCategory(state, updatedCategory) {
      const index = state.categories.findIndex(c => c.id === updatedCategory.id)
      if (index !== -1) {
        state.categories.splice(index, 1, updatedCategory)
      }
    },
    removeCategory(state, categoryId) {
      state.categories = state.categories.filter(c => c.id !== categoryId)
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    }
  },

  actions: {
    async fetchCategories({ commit }) {
      commit('setLoading', true)
      try {
        const response = await axios.get('/api/restaurant/categories')
        commit('setCategories', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to fetch categories')
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async createCategory({ commit }, categoryData) {
      try {
        const response = await axios.post('/api/restaurant/categories', categoryData)
        commit('addCategory', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to create category')
        throw error
      }
    },

    async updateCategory({ commit }, { id, ...categoryData }) {
      try {
        const response = await axios.put(`/api/restaurant/categories/${id}`, categoryData)
        commit('updateCategory', response.data)
        return response.data
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to update category')
        throw error
      }
    },

    async deleteCategory({ commit }, categoryId) {
      try {
        await axios.delete(`/api/restaurant/categories/${categoryId}`)
        commit('removeCategory', categoryId)
      } catch (error) {
        commit('setError', error.response?.data?.message || 'Failed to delete category')
        throw error
      }
    }
  },

  getters: {
    getCategories: state => state.categories,
    isLoading: state => state.loading,
    getError: state => state.error
  }
}