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
      commit('SET_RESTAURANT_DETAILS', response.data.data.restaurant);
      return response.data.data.restaurant;
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
      commit('SET_RESTAURANT_MENU', response.data.data.categories);
      return response.data.data.categories;
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
      commit('SET_RESTAURANT_REVIEWS', response.data.data.reviews);
      return response.data;
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