import { defineStore } from 'pinia'
import { apiClient } from '@/services/api.service' // Assuming api.service is correctly set up

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false,
    error: null,
    selectedCategory: null,
    // items: [] // This was in Vuex state but not used in getters/mutations/actions, omitting for now
  }),

  getters: {
    // Renamed to avoid conflict with state properties if accessed directly
    allCategories: (state) => state.categories,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getSelectedCategory: (state) => state.selectedCategory
  },

  actions: {
    // Replaces SET_CATEGORIES mutation
    _setCategories(categories) {
      this.categories = categories
    },
    // Replaces SET_LOADING mutation
    _setLoading(loading) {
      this.loading = loading
    },
    // Replaces SET_ERROR mutation
    _setError(error) {
      this.error = error
    },
    // Replaces SET_SELECTED_CATEGORY mutation
    _setSelectedCategory(category) {
      this.selectedCategory = category
    },

    // Original fetchCategories action
    async fetchCategories() {
      try {
        this._setLoading(true)
        const response = await apiClient.get('/api/categories')
        const categories = response.data?.items || []
        this._setCategories(categories)
        this._setError(null)
        return categories // Return the fetched categories
      } catch (error) {
        const errorMessage = error.message || 'Failed to fetch categories'
        this._setError(errorMessage)
        console.error('Error fetching categories:', error)
        return [] // Return empty array on error
      } finally {
        this._setLoading(false)
      }
    },

    // Original selectCategory action
    selectCategory(category) {
      this._setSelectedCategory(category)
    }
  }
})