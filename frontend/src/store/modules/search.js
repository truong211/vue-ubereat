import { getDistance } from 'geolib'

const state = {
  searchHistory: [],
  recentSearches: [],
  searchResults: [],
  selectedLocation: null,
  filters: {
    distance: 5,
    rating: 0,
    priceRange: [],
    cuisines: []
  },
  sortBy: 'relevance',
  loading: false,
  error: null
}

const getters = {
  getSearchHistory: state => state.searchHistory,
  getRecentSearches: state => state.recentSearches,
  getSearchResults: state => state.searchResults,
  getSelectedLocation: state => state.selectedLocation,
  getFilters: state => state.filters,
  getSortBy: state => state.sortBy,
  isLoading: state => state.loading,
  getError: state => state.error,
  
  // Get restaurants sorted and filtered according to current criteria
  getFilteredResults: (state, getters, rootState) => {
    let results = [...state.searchResults]
    const userLocation = rootState.user.location

    // Apply filters
    if (state.filters.rating > 0) {
      results = results.filter(r => r.rating >= state.filters.rating)
    }

    if (state.filters.priceRange.length > 0) {
      results = results.filter(r => state.filters.priceRange.includes(r.priceLevel))
    }

    if (state.filters.cuisines.length > 0) {
      results = results.filter(r => 
        r.cuisines.some(c => state.filters.cuisines.includes(c))
      )
    }

    // Calculate distances if user location is available
    if (userLocation) {
      results = results.filter(r => {
        const distance = getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: r.location.lat, longitude: r.location.lng }
        ) / 1000 // Convert to kilometers
        
        r.distance = distance // Add distance to restaurant object
        return distance <= state.filters.distance
      })
    }

    // Apply sorting
    switch (state.sortBy) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'distance':
        if (userLocation) {
          results.sort((a, b) => a.distance - b.distance)
        }
        break
      case 'price_asc':
        results.sort((a, b) => a.priceLevel.length - b.priceLevel.length)
        break
      case 'price_desc':
        results.sort((a, b) => b.priceLevel.length - a.priceLevel.length)
        break
      // relevance is default, results are already sorted by relevance from API
    }

    return results
  }
}

const mutations = {
  SET_SEARCH_RESULTS(state, results) {
    state.searchResults = results
  },
  SET_SELECTED_LOCATION(state, location) {
    state.selectedLocation = location
  },
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters }
  },
  SET_SORT_BY(state, sortBy) {
    state.sortBy = sortBy
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  ADD_TO_SEARCH_HISTORY(state, searchItem) {
    // Add to beginning, maintain uniqueness, limit to 10 items
    const updated = [
      searchItem,
      ...state.searchHistory.filter(item => item.id !== searchItem.id)
    ].slice(0, 10)
    
    state.searchHistory = updated
    // Persist to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(updated))
  },
  SET_SEARCH_HISTORY(state, history) {
    state.searchHistory = history
  },
  ADD_TO_RECENT_SEARCHES(state, searchItem) {
    // Add to beginning, maintain uniqueness, limit to 5 items
    const updated = [
      searchItem,
      ...state.recentSearches.filter(item => item.id !== searchItem.id)
    ].slice(0, 5)
    
    state.recentSearches = updated
    // Persist to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  },
  SET_RECENT_SEARCHES(state, searches) {
    state.recentSearches = searches
  }
}

const actions = {
  async searchRestaurants({ commit, rootState }, { query, location, filters = {} }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      // Get user's saved location if not provided
      const searchLocation = location || rootState.user.location
      
      const response = await fetch('/api/search/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          location: searchLocation,
          filters
        })
      })

      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data = await response.json()
      commit('SET_SEARCH_RESULTS', data.results)
      
      // Save search to history if it was successful
      if (query) {
        commit('ADD_TO_SEARCH_HISTORY', {
          id: Date.now(),
          query,
          timestamp: new Date().toISOString()
        })
      }

      return data.results
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  updateFilters({ commit }, filters) {
    commit('SET_FILTERS', filters)
  },

  updateSortBy({ commit }, sortBy) {
    commit('SET_SORT_BY', sortBy)
  },

  // Load persisted search history from localStorage
  loadSearchHistory({ commit }) {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      commit('SET_SEARCH_HISTORY', JSON.parse(history))
    }
  },

  // Load persisted recent searches from localStorage
  loadRecentSearches({ commit }) {
    const searches = localStorage.getItem('recentSearches')
    if (searches) {
      commit('SET_RECENT_SEARCHES', JSON.parse(searches))
    }
  },

  // Clear search history
  clearSearchHistory({ commit }) {
    commit('SET_SEARCH_HISTORY', [])
    localStorage.removeItem('searchHistory')
  },

  // Clear recent searches
  clearRecentSearches({ commit }) {
    commit('SET_RECENT_SEARCHES', [])
    localStorage.removeItem('recentSearches')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}