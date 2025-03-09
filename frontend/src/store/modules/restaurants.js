import axios from 'axios'
import { API_URL } from '@/config'

export default {
  namespaced: true,
  
  state: {
    restaurants: [],
    featuredRestaurants: [],
    popularRestaurants: [],
    currentRestaurant: null,
    loading: false,
    error: null,
    filters: {
      category: null,
      rating: null,
      priceRange: null,
      searchQuery: ''
    }
  },
  
  getters: {
    allRestaurants: state => state.restaurants,
    featuredRestaurants: state => state.featuredRestaurants,
    popularRestaurants: state => state.popularRestaurants,
    currentRestaurant: state => state.currentRestaurant,
    isLoading: state => state.loading,
    getError: state => state.error,
    getFilters: state => state.filters
  },
  
  mutations: {
    SET_RESTAURANTS(state, restaurants) {
      state.restaurants = restaurants
    },
    SET_FEATURED_RESTAURANTS(state, restaurants) {
      state.featuredRestaurants = restaurants
    },
    SET_POPULAR_RESTAURANTS(state, restaurants) {
      state.popularRestaurants = restaurants
    },
    SET_CURRENT_RESTAURANT(state, restaurant) {
      state.currentRestaurant = restaurant
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_FILTER(state, { filterType, value }) {
      state.filters[filterType] = value
    },
    CLEAR_FILTERS(state) {
      state.filters = {
        category: null,
        rating: null,
        priceRange: null,
        searchQuery: ''
      }
    }
  },
  
  actions: {
    async fetchRestaurants({ commit }) {
      try {
        commit('SET_LOADING', true)
        const response = await axios.get(`${API_URL}/restaurants`)
        commit('SET_RESTAURANTS', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch restaurants')
        console.error('Error fetching restaurants:', error)
        return []
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchFeaturedRestaurants({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/restaurants/featured`)
        commit('SET_FEATURED_RESTAURANTS', response.data)
      } catch (error) {
        console.error('Error fetching featured restaurants:', error)
        commit('SET_ERROR', error.message || 'Failed to fetch featured restaurants')
      }
    },
    
    async fetchPopularRestaurants({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/restaurants/popular`)
        commit('SET_POPULAR_RESTAURANTS', response.data)
      } catch (error) {
        console.error('Error fetching popular restaurants:', error)
        commit('SET_ERROR', error.message || 'Failed to fetch popular restaurants')
      }
    },
    
    async fetchRestaurantById({ commit }, restaurantId) {
      try {
        commit('SET_LOADING', true)
        const response = await axios.get(`${API_URL}/restaurants/${restaurantId}`)
        commit('SET_CURRENT_RESTAURANT', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch restaurant details')
        console.error('Error fetching restaurant details:', error)
        return null
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    setFilter({ commit }, { filterType, value }) {
      commit('SET_FILTER', { filterType, value })
    },
    
    clearFilters({ commit }) {
      commit('CLEAR_FILTERS')
    }
  }
}