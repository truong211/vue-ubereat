import { restaurantService } from '../../services/restaurant.service';

// Initial state
const state = {
  restaurants: [],
  featuredRestaurants: [],
  popularRestaurants: [],
  restaurantDetails: null,
  restaurantMenu: [],
  restaurantReviews: [],
  loading: false,
  error: null,
  totalRestaurants: 0,
  userLocation: null
};

// Getters
const getters = {
  getRestaurantById: (state) => (id) => {
    return state.restaurants.find(restaurant => restaurant.id == id);
  },
  getNearbyRestaurants: (state) => (maxDistance = 5) => {
    if (!state.userLocation) return [];
    return state.restaurants
      .filter(restaurant => restaurant.distance && restaurant.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  },
  getHighestRatedRestaurants: (state) => (limit = 5) => {
    return [...state.restaurants]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  },
  getRestaurantsByCategory: (state) => (categoryId) => {
    return state.restaurants.filter(restaurant => {
      const categories = restaurant.categories || [];
      return categories.some(cat => cat.id == categoryId);
    });
  }
};

// Actions
const actions = {
  async fetchRestaurants({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.getAllRestaurants(params);
      commit('SET_RESTAURANTS', response.data.data.restaurants);
      commit('SET_TOTAL_RESTAURANTS', response.data.results);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch restaurants');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchRestaurantById({ commit }, { id, params = {} }) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.getRestaurantById(id, params);
      
      // Handle different response structures with fallbacks
      let restaurantData;
      
      if (response.data && response.data.data && response.data.data.restaurant) {
        // Standard API response structure
        restaurantData = response.data.data.restaurant;
      } else if (response.data && response.data.restaurant) {
        // Alternative API response structure
        restaurantData = response.data.restaurant;
      } else if (response.data && typeof response.data === 'object') {
        // Direct restaurant object in response
        restaurantData = response.data;
      } else {
        // Fallback to empty object if no recognized structure
        console.warn('Unexpected restaurant data structure:', response);
        restaurantData = {};
      }
      
      // Ensure basic restaurant properties exist to prevent errors
      if (!restaurantData.menuCategories) {
        restaurantData.menuCategories = [];
      }
      if (!restaurantData.reviews) {
        restaurantData.reviews = [];
      }
      if (!restaurantData.categories) {
        restaurantData.categories = [];
      }
      
      commit('SET_RESTAURANT_DETAILS', restaurantData);
      return restaurantData;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch restaurant details');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchRestaurantMenu({ commit }, id) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.getRestaurantMenu(id);
      
      // Handle different response structures with fallbacks
      let menuData = [];
      
      if (response.data && response.data.data && response.data.data.categories) {
        // Standard API response structure
        menuData = response.data.data.categories;
      } else if (response.data && response.data.categories) {
        // Alternative API response structure
        menuData = response.data.categories;
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array of categories in response
        menuData = response.data;
      } else if (response.data && response.data.menu && Array.isArray(response.data.menu)) {
        // Menu property containing array
        menuData = response.data.menu;
      } else {
        // Fallback to empty array if no recognized structure
        console.warn('Unexpected menu data structure:', response);
      }
      
      commit('SET_RESTAURANT_MENU', menuData);
      return menuData;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch restaurant menu');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchRestaurantReviews({ commit }, { id, params = {} }) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.getRestaurantReviews(id, params);
      
      // Handle different response structures with fallbacks
      let reviewsData = [];
      
      if (response.data && response.data.data && response.data.data.reviews) {
        // Standard API response structure
        reviewsData = response.data.data.reviews;
      } else if (response.data && response.data.reviews) {
        // Alternative API response structure
        reviewsData = response.data.reviews;
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array of reviews in response
        reviewsData = response.data;
      } else {
        // Fallback to empty array if no recognized structure
        console.warn('Unexpected reviews data structure:', response);
      }
      
      commit('SET_RESTAURANT_REVIEWS', reviewsData);
      return reviewsData;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch restaurant reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async searchRestaurantsByLocation({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.searchByLocation(params);
      commit('SET_RESTAURANTS', response.data.data.restaurants);
      commit('SET_TOTAL_RESTAURANTS', response.data.results);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to search restaurants by location');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchFeaturedRestaurants({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.getFeaturedRestaurants(params);
      commit('SET_FEATURED_RESTAURANTS', response.data.data.restaurants);
      return response.data.data.restaurants;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch featured restaurants');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchPopularRestaurants({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      const response = await restaurantService.getPopularRestaurants(params);
      commit('SET_POPULAR_RESTAURANTS', response.data.data.restaurants);
      return response.data.data.restaurants;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch popular restaurants');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setUserLocation({ commit }, location) {
    commit('SET_USER_LOCATION', location);
  },

  // Add compatibility action for components using fetchRestaurantDetails
  async fetchRestaurantDetails({ dispatch }, id) {
    console.warn('fetchRestaurantDetails is deprecated, use fetchRestaurantById instead');
    return await dispatch('fetchRestaurantById', { id });
  }
};

// Mutations
const mutations = {
  SET_RESTAURANTS(state, restaurants) {
    state.restaurants = restaurants;
  },
  SET_TOTAL_RESTAURANTS(state, total) {
    state.totalRestaurants = total;
  },
  SET_FEATURED_RESTAURANTS(state, restaurants) {
    state.featuredRestaurants = restaurants;
  },
  SET_POPULAR_RESTAURANTS(state, restaurants) {
    state.popularRestaurants = restaurants;
  },
  SET_RESTAURANT_DETAILS(state, restaurant) {
    state.restaurantDetails = restaurant;
  },
  SET_RESTAURANT_MENU(state, menu) {
    state.restaurantMenu = menu;
  },
  SET_RESTAURANT_REVIEWS(state, reviews) {
    state.restaurantReviews = reviews;
  },
  SET_LOADING(state, isLoading) {
    state.loading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_USER_LOCATION(state, location) {
    state.userLocation = location;
  },
  CLEAR_RESTAURANT_DETAILS(state) {
    state.restaurantDetails = null;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};