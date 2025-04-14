import { restaurantService } from '@/services/restaurant.service'

export default {
  namespaced: true,
  
  state: {
    restaurants: [],
    filteredRestaurants: [],
    featuredRestaurants: [],
    popularRestaurants: [],
    restaurantDetails: null,
    restaurantMenu: [],
    restaurantReviews: [],
    loading: false,
    error: null,
    totalRestaurants: 0,
    userLocation: null,
    filters: {
      search: '',
      cuisine: null,
      sortBy: 'rating',
      rating: null,
      deliveryTime: null,
      distance: null,
      priceRange: null,
      latitude: null,
      longitude: null,
      category_id: null,
      page: 1,
      limit: 12
    }
  },

  getters: {
    getRestaurantById: (state) => (id) => {
      return state.restaurants.find(restaurant => restaurant.id == id)
    },
    
    getNearbyRestaurants: (state) => (maxDistance = 5) => {
      if (!state.userLocation) return []
      return state.restaurants
        .filter(restaurant => restaurant.distance && restaurant.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
    },
    
    getFilteredRestaurants: (state) => {
      let results = [...state.restaurants]
      const filters = state.filters

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        results = results.filter(restaurant =>
          restaurant.name.toLowerCase().includes(searchLower) ||
          (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchLower))
        )
      }

      if (filters.cuisine) {
        results = results.filter(restaurant =>
          restaurant.cuisine === filters.cuisine
        )
      }

      if (filters.rating) {
        results = results.filter(restaurant =>
          (restaurant.rating || 0) >= filters.rating
        )
      }

      if (filters.deliveryTime) {
        results = results.filter(restaurant => {
          const deliveryTime = typeof restaurant.delivery_time === 'string'
            ? parseInt(restaurant.delivery_time.split('-')[1] || restaurant.delivery_time, 10)
            : restaurant.delivery_time
          return (deliveryTime || 60) <= filters.deliveryTime
        })
      }

      if (filters.distance && state.userLocation) {
        results = results.filter(restaurant =>
          (restaurant.distance || 999) <= filters.distance
        )
      }

      if (filters.priceRange) {
        results = results.filter(restaurant =>
          restaurant.price_range === filters.priceRange
        )
      }

      switch (filters.sortBy) {
        case 'rating':
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case 'name_asc':
          results.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name_desc':
          results.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'distance':
          if (state.userLocation) {
            results.sort((a, b) => (a.distance || 999) - (b.distance || 999))
          }
          break
        case 'delivery_time':
          results.sort((a, b) => {
            const aTime = typeof a.delivery_time === 'string'
              ? parseInt(a.delivery_time.split('-')[0] || a.delivery_time, 10)
              : a.delivery_time || 60
            const bTime = typeof b.delivery_time === 'string'
              ? parseInt(b.delivery_time.split('-')[0] || b.delivery_time, 10)
              : b.delivery_time || 60
            return aTime - bTime
          })
          break
      }

      return results
    }
  },

  mutations: {
    SET_RESTAURANTS(state, restaurants) {
      state.restaurants = restaurants
    },
    SET_TOTAL_RESTAURANTS(state, total) {
      state.totalRestaurants = total
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_USER_LOCATION(state, location) {
      state.userLocation = location
    },
    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters }
    },
    RESET_FILTERS(state) {
      state.filters = {
        search: '',
        cuisine: null,
        sortBy: 'rating',
        rating: null,
        deliveryTime: null,
        distance: null,
        priceRange: null,
        latitude: state.filters.latitude,
        longitude: state.filters.longitude,
        category_id: null,
        page: 1,
        limit: 12
      }
    },
    INCREMENT_PAGE(state) {
      state.filters.page++
    },
    SET_PAGE(state, page) {
      state.filters.page = page
    },
    TOGGLE_RESTAURANT_FAVORITE(state, restaurantId) {
      const restaurant = state.restaurants.find(r => r.id === restaurantId)
      if (restaurant) {
        restaurant.isFavorite = !restaurant.isFavorite
      }
    }
  },

  actions: {
    async fetchRestaurants({ commit, state }, params = {}) {
      commit('SET_LOADING', true)
      try {
        if (params) {
          commit('SET_FILTERS', params)
        }
        
        console.log('[Store Debug] Fetching restaurants with filters:', state.filters)
        const response = await restaurantService.getAllRestaurants(state.filters)
        console.log('[Store Debug] Received restaurants:', response.data.data.restaurants.length)
        
        commit('SET_RESTAURANTS', response.data.data.restaurants)
        commit('SET_TOTAL_RESTAURANTS', response.data.results)
        commit('SET_ERROR', null)
        
        return response.data
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch restaurants'
        commit('SET_ERROR', errorMessage)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    setUserLocation({ commit }, location) {
      commit('SET_USER_LOCATION', location)
    },

    resetFilters({ commit }) {
      commit('RESET_FILTERS')
    },

    async loadMoreRestaurants({ commit, dispatch }) {
      commit('INCREMENT_PAGE')
      return await dispatch('fetchRestaurants')
    },

    async changePage({ commit, dispatch }, page) {
      commit('SET_PAGE', page)
      return await dispatch('fetchRestaurants')
    },

    async toggleFavorite({ commit }, restaurantId) {
      try {
        await restaurantService.toggleFavorite(restaurantId)
        commit('TOGGLE_RESTAURANT_FAVORITE', restaurantId)
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
        throw error
      }
    }
  }
}
