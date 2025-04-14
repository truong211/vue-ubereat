import { defineStore } from 'pinia'
import productService from '@/services/product.service'

export const useProductStore = defineStore('product', {
  state: () => ({
    featuredProducts: [],
    allProducts: [],
    currentProduct: null,
    loading: false,
    error: null
  }),

  getters: {
    getFeaturedProducts: (state) => state.featuredProducts,
    getAllProducts: (state) => state.allProducts,
    getCurrentProduct: (state) => state.currentProduct,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },

  actions: {
    async fetchFeaturedProducts() {
      try {
        this.loading = true
        const response = await productService.getProducts({
          limit: 8,
          sort: 'popular',
          onSale: true
        })
        this.featuredProducts = response.data || []
        this.error = null
        return this.featuredProducts
      } catch (error) {
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchProducts(params) {
      try {
        this.loading = true
        const response = await productService.getProducts(params)
        this.allProducts = response.data || []
        this.error = null
        return this.allProducts
      } catch (error) {
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },

    setCurrentProduct(product) {
      this.currentProduct = product
    }
  }
}) 