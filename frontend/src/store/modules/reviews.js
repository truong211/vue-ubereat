import axios from 'axios';

// Initial state
const state = {
  loading: false,
  error: null,
  reviews: [],
  userReviews: [],
  restaurantReviews: {},
  productReviews: {},
  stats: null,
  pendingModeration: []
};

// Mutations
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
  },
  SET_PENDING_MODERATION(state, reviews) {
    state.pendingModeration = reviews;
  }
};

// Actions
const actions = {
  // Fetch all reviews (paginated)
  async fetchReviews({ commit }, { page = 1, limit = 10, filters = {} }) {
    try {
      commit('SET_LOADING', true);
      const params = { page, limit, ...filters };
      const response = await axios.get('/api/reviews', { params });
      commit('SET_REVIEWS', response.data.data.reviews);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

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
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch product reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Fetch user's own reviews
  async fetchUserReviews({ commit }, { page = 1, limit = 10 }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get('/api/reviews/user', {
        params: { page, limit }
      });
      commit('SET_USER_REVIEWS', response.data.data.reviews);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch user reviews');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Create a new review
  async createReview({ commit }, { orderId, restaurantId, productId, rating, comment, tags }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.post('/api/reviews', {
        orderId,
        restaurantId,
        productId,
        rating,
        comment,
        tags
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

  // Update an existing review
  async updateReview({ commit }, { reviewId, rating, comment, tags }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.put(`/api/reviews/${reviewId}`, {
        rating,
        comment,
        tags
      });
      
      const review = response.data.data.review;
      commit('UPDATE_REVIEW', {
        reviewId,
        updates: { rating, comment, tags },
        type: review.productId ? 'product' : 'restaurant',
        id: review.productId || review.restaurantId
      });
      
      return review;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Delete a review
  async deleteReview({ commit }, { reviewId }) {
    try {
      commit('SET_LOADING', true);
      await axios.delete(`/api/reviews/${reviewId}`);
      
      // Find review to determine its type before deletion
      const productReview = Object.entries(state.productReviews)
        .find(([id, reviews]) => reviews.some(r => r.id === reviewId));
      const restaurantReview = Object.entries(state.restaurantReviews)
        .find(([id, reviews]) => reviews.some(r => r.id === reviewId));
      
      if (productReview) {
        commit('DELETE_REVIEW', { reviewId, type: 'product', id: productReview[0] });
      }
      if (restaurantReview) {
        commit('DELETE_REVIEW', { reviewId, type: 'restaurant', id: restaurantReview[0] });
      }
      
      return true;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Restaurant owner respond to a review
  async respondToReview({ commit }, { reviewId, response }) {
    try {
      commit('SET_LOADING', true);
      const result = await axios.post(`/api/reviews/${reviewId}/respond`, { response });
      
      // Update the review with the response
      const review = result.data.data.review;
      commit('UPDATE_REVIEW', {
        reviewId,
        updates: { response, responseDate: new Date() },
        type: review.productId ? 'product' : 'restaurant',
        id: review.productId || review.restaurantId
      });
      
      return result.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to respond to review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Update a restaurant owner's response to a review
  async updateReviewResponse({ commit }, { reviewId, response }) {
    try {
      commit('SET_LOADING', true);
      const result = await axios.put(`/api/reviews/${reviewId}/respond`, { response });
      
      // Update the review with the response
      const review = result.data.data.review;
      commit('UPDATE_REVIEW', {
        reviewId,
        updates: { response, responseDate: new Date() },
        type: review.productId ? 'product' : 'restaurant',
        id: review.productId || review.restaurantId
      });
      
      return result.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update response');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Vote on a review (helpful/unhelpful)
  async voteReview({ commit }, { reviewId, isHelpful }) {
    try {
      commit('SET_LOADING', true);
      const result = await axios.post(`/api/reviews/${reviewId}/vote`, { isHelpful });
      
      return result.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to vote on review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Get current user's vote on a review
  async getUserVote({ commit }, { reviewId }) {
    try {
      commit('SET_LOADING', true);
      const result = await axios.get(`/api/reviews/${reviewId}/vote`);
      return result.data.data.vote;
    } catch (error) {
      // This might 404 if user hasn't voted, which is fine
      if (error.response && error.response.status !== 404) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to get user vote');
      }
      return null;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Report a review
  async reportReview({ commit }, { reviewId, reason, description }) {
    try {
      commit('SET_LOADING', true);
      const result = await axios.post(`/api/reviews/${reviewId}/report`, { 
        reason, 
        description 
      });
      
      return result.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to report review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Upload photos for a review
  async uploadReviewPhotos({ commit }, { reviewId, photos }) {
    try {
      commit('SET_LOADING', true);
      
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('images', photo);
      });
      
      const result = await axios.post(`/api/reviews/${reviewId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the review with the new images
      const images = result.data.data.images;
      
      // Find the review and update it
      const reviewInRestaurant = Object.entries(state.restaurantReviews)
        .find(([id, reviews]) => reviews.some(r => r.id === reviewId));
      const reviewInProduct = Object.entries(state.productReviews)
        .find(([id, reviews]) => reviews.some(r => r.id === reviewId));
      
      if (reviewInRestaurant) {
        commit('UPDATE_REVIEW', {
          reviewId,
          updates: { images },
          type: 'restaurant',
          id: reviewInRestaurant[0]
        });
      }
      if (reviewInProduct) {
        commit('UPDATE_REVIEW', {
          reviewId,
          updates: { images },
          type: 'product',
          id: reviewInProduct[0]
        });
      }
      
      return images;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to upload photos');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Fetch reviews pending moderation (admin/moderator only)
  async fetchPendingModeration({ commit }, { page = 1, limit = 20 }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get('/api/reviews/moderation', {
        params: { page, limit }
      });
      
      commit('SET_PENDING_MODERATION', response.data.data.reviews);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch reviews pending moderation');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Moderate a review (admin/moderator only)
  async moderateReview({ commit }, { reviewId, moderationStatus, moderationReason }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.patch(`/api/reviews/${reviewId}/moderate`, {
        moderationStatus,
        moderationReason
      });
      
      // Remove from pending moderation list
      const pendingIndex = state.pendingModeration.findIndex(r => r.id === reviewId);
      if (pendingIndex !== -1) {
        commit('SET_PENDING_MODERATION', [
          ...state.pendingModeration.slice(0, pendingIndex),
          ...state.pendingModeration.slice(pendingIndex + 1)
        ]);
      }
      
      // Update the review in other lists
      const reviewInRestaurant = Object.entries(state.restaurantReviews)
        .find(([id, reviews]) => reviews.some(r => r.id === reviewId));
      const reviewInProduct = Object.entries(state.productReviews)
        .find(([id, reviews]) => reviews.some(r => r.id === reviewId));
      
      const updates = {
        moderationStatus,
        moderationReason,
        moderatedAt: new Date(),
        isVisible: moderationStatus === 'approved'
      };
      
      if (reviewInRestaurant) {
        commit('UPDATE_REVIEW', {
          reviewId,
          updates,
          type: 'restaurant',
          id: reviewInRestaurant[0]
        });
      }
      if (reviewInProduct) {
        commit('UPDATE_REVIEW', {
          reviewId,
          updates,
          type: 'product',
          id: reviewInProduct[0]
        });
      }
      
      return response.data.data.review;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to moderate review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Fetch review analytics (for restaurant owners and admins)
  async fetchReviewAnalytics({ commit }, { restaurantId }) {
    try {
      commit('SET_LOADING', true);
      const params = restaurantId ? { restaurantId } : {};
      const response = await axios.get('/api/reviews/analytics', { params });
      
      return response.data.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch review analytics');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Create a driver review
  async createDriverReview({ commit }, { orderId, driverId, rating, comment, tags }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.post('/api/driver-reviews', {
        orderId,
        driverId,
        rating,
        comment,
        tags
      });
      
      return response.data.data.review;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create driver review');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

// Getters
const getters = {
  isLoading: state => state.loading,
  hasError: state => !!state.error,
  errorMessage: state => state.error,
  getRestaurantReviews: state => restaurantId => state.restaurantReviews[restaurantId] || [],
  getProductReviews: state => productId => state.productReviews[productId] || [],
  getUserReviews: state => state.userReviews,
  getReviewStats: state => state.stats,
  getPendingModeration: state => state.pendingModeration
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};