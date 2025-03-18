import axios from 'axios';

const state = {
  reviews: [],
  restaurantReviews: {},
  productReviews: {},
  userReviews: [],
  loading: false,
  error: null,
  stats: {
    average: 0,
    total: 0,
    distribution: []
  }
};

const mutations = {
  SET_LOADING(state, status) {
    state.loading = status;
  },

  SET_ERROR(state, error) {
    state.error = error;
  },

  SET_REVIEWS(state, reviews) {
    state.reviews = reviews;
  },

  SET_RESTAURANT_REVIEWS(state, { restaurantId, reviews, stats }) {
    state.restaurantReviews[restaurantId] = reviews;
    if (stats) {
      state.stats = stats;
    }
  },

  SET_PRODUCT_REVIEWS(state, { productId, reviews }) {
    state.productReviews[productId] = reviews;
  },

  SET_USER_REVIEWS(state, reviews) {
    state.userReviews = reviews;
  },

  ADD_REVIEW(state, { review, type, id }) {
    if (type === 'restaurant') {
      if (!state.restaurantReviews[id]) {
        state.restaurantReviews[id] = [];
      }
      state.restaurantReviews[id].unshift(review);
    } else if (type === 'product') {
      if (!state.productReviews[id]) {
        state.productReviews[id] = [];
      }
      state.productReviews[id].unshift(review);
    }
    state.userReviews.unshift(review);
  },

  UPDATE_REVIEW(state, { reviewId, updates, type, id }) {
    const updateReview = (reviews) => {
      const index = reviews.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        reviews[index] = { ...reviews[index], ...updates };
      }
    };

    if (type === 'restaurant' && state.restaurantReviews[id]) {
      updateReview(state.restaurantReviews[id]);
    } else if (type === 'product' && state.productReviews[id]) {
      updateReview(state.productReviews[id]);
    }
    updateReview(state.userReviews);
  },

  DELETE_REVIEW(state, { reviewId, type, id }) {
    const removeReview = (reviews) => {
      const index = reviews.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        reviews.splice(index, 1);
      }
    };

    if (type === 'restaurant' && state.restaurantReviews[id]) {
      removeReview(state.restaurantReviews[id]);
    } else if (type === 'product' && state.productReviews[id]) {
      removeReview(state.productReviews[id]);
    }
    removeReview(state.userReviews);
  }
};

const actions = {
  // Fetch reviews for a restaurant
  async fetchRestaurantReviews({ commit }, { restaurantId, page = 1, limit = 10, sort = 'recent' }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get(`/api/reviews/restaurant/${restaurantId}`, {
        params: { page, limit, sort }
      });
      commit('SET_RESTAURANT_REVIEWS', {
        restaurantId,
        reviews: response.data.data.reviews,
        stats: response.data.data.stats
      });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Fetch reviews for a product
  async fetchProductReviews({ commit }, { productId, page = 1, limit = 10 }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get(`/api/reviews/product/${productId}`, {
        params: { page, limit }
      });
      commit('SET_PRODUCT_REVIEWS', {
        productId,
        reviews: response.data.data.reviews
      });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Fetch reviews by current user
  async fetchUserReviews({ commit }, { page = 1, limit = 10 }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get('/api/reviews/user', {
        params: { page, limit }
      });
      commit('SET_USER_REVIEWS', response.data.data.reviews);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Create a new review
  async createReview({ commit }, { orderId, restaurantId, productId, rating, comment }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.post('/api/reviews', {
        orderId,
        restaurantId,
        productId,
        rating,
        comment
      });
      
      const review = response.data.data.review;
      if (restaurantId) {
        commit('ADD_REVIEW', { review, type: 'restaurant', id: restaurantId });
      }
      if (productId) {
        commit('ADD_REVIEW', { review, type: 'product', id: productId });
      }
      
      return review;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Update a review
  async updateReview({ commit }, { reviewId, rating, comment, type, id }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.put(`/api/reviews/${reviewId}`, {
        rating,
        comment
      });
      
      const updates = response.data.data.review;
      commit('UPDATE_REVIEW', { reviewId, updates, type, id });
      
      return updates;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Delete a review
  async deleteReview({ commit }, { reviewId, type, id }) {
    try {
      commit('SET_LOADING', true);
      await axios.delete(`/api/reviews/${reviewId}`);
      commit('DELETE_REVIEW', { reviewId, type, id });
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Restaurant owner respond to review
  async respondToReview({ commit }, { reviewId, response }) {
    try {
      commit('SET_LOADING', true);
      const res = await axios.post(`/api/reviews/${reviewId}/respond`, { response });
      const updates = res.data.data.review;
      commit('UPDATE_REVIEW', { 
        reviewId, 
        updates,
        type: 'restaurant',
        id: updates.restaurantId
      });
      return updates;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to respond to review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Fetch review statistics
  async fetchReviewStats({ commit }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get('/api/reviews/dashboard/stats');
      return response.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch review statistics');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  isLoading: state => state.loading,
  getError: state => state.error,
  getRestaurantReviews: state => restaurantId => state.restaurantReviews[restaurantId] || [],
  getProductReviews: state => productId => state.productReviews[productId] || [],
  getUserReviews: state => state.userReviews,
  getStats: state => state.stats
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};