import axios from 'axios';

const state = {
  restaurantReviews: {},
  userReviews: [],
  isLoading: false,
  error: null
};

const mutations = {
  SET_RESTAURANT_REVIEWS(state, { restaurantId, reviews, stats }) {
    state.restaurantReviews[restaurantId] = { reviews, stats };
  },
  ADD_REVIEWS(state, { restaurantId, reviews }) {
    if (state.restaurantReviews[restaurantId]) {
      state.restaurantReviews[restaurantId].reviews.push(...reviews);
    }
  },
  SET_USER_REVIEWS(state, reviews) {
    state.userReviews = reviews;
  },
  SET_LOADING(state, loading) {
    state.isLoading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async getRestaurantReviews({ commit }, { restaurantId, page = 1, rating, sort }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get(`/api/reviews/restaurant/${restaurantId}`, {
        params: { page, rating, sort }
      });
      
      if (page === 1) {
        commit('SET_RESTAURANT_REVIEWS', {
          restaurantId,
          reviews: response.data.data.reviews,
          stats: response.data.data.stats
        });
      } else {
        commit('ADD_REVIEWS', {
          restaurantId,
          reviews: response.data.data.reviews
        });
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải đánh giá');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async submitReview({ commit, dispatch }, formData) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.post('/api/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể gửi đánh giá');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async voteReview({ commit }, { reviewId, isHelpful }) {
    try {
      const response = await axios.post(`/api/reviews/${reviewId}/vote`, {
        isHelpful
      });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể đánh giá review');
      throw error;
    }
  },

  async reportReview({ commit }, { reviewId, reason, description }) {
    try {
      const response = await axios.post(`/api/reviews/${reviewId}/report`, {
        reason,
        description
      });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể báo cáo review');
      throw error;
    }
  },

  async getUserReviews({ commit }) {
    try {
      commit('SET_LOADING', true);
      const response = await axios.get('/api/reviews/user');
      commit('SET_USER_REVIEWS', response.data.data.reviews);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải đánh giá của bạn');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  getRestaurantReviews: state => restaurantId => {
    return state.restaurantReviews[restaurantId] || { reviews: [], stats: {} };
  },
  getUserReviews: state => state.userReviews,
  isLoading: state => state.isLoading,
  error: state => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};