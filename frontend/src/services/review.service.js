import axios from 'axios';
import { API_URL } from '@/config';

const reviewService = {
  /**
   * Get reviews for a restaurant
   * @param {number} restaurantId - Restaurant ID
   * @param {Object} params - Query parameters (page, limit, sort, rating)
   */
  getRestaurantReviews(restaurantId, params = {}) {
    return axios.get(`${API_URL}/reviews/restaurant/${restaurantId}`, { params });
  },

  /**
   * Create a new review
   * @param {Object} review - Review data (restaurantId, rating, comment, images)
   */
  createReview(review) {
    const formData = new FormData();
    Object.keys(review).forEach(key => {
      if (key === 'images') {
        review[key].forEach(image => formData.append('images', image));
      } else {
        formData.append(key, review[key]);
      }
    });
    return axios.post(`${API_URL}/reviews`, formData);
  },

  /**
   * Update an existing review
   * @param {number} reviewId - Review ID
   * @param {Object} review - Updated review data
   */
  updateReview(reviewId, review) {
    const formData = new FormData();
    Object.keys(review).forEach(key => {
      if (key === 'images') {
        review[key].forEach(image => formData.append('images', image));
      } else {
        formData.append(key, review[key]);
      }
    });
    return axios.put(`${API_URL}/reviews/${reviewId}`, formData);
  },

  /**
   * Delete a review
   * @param {number} reviewId - Review ID
   */
  deleteReview(reviewId) {
    return axios.delete(`${API_URL}/reviews/${reviewId}`);
  },

  /**
   * Vote on a review (helpful/not helpful)
   * @param {number} reviewId - Review ID
   * @param {boolean} isHelpful - Whether the vote is helpful
   */
  voteReview(reviewId, isHelpful) {
    return axios.post(`${API_URL}/reviews/${reviewId}/vote`, { isHelpful });
  },

  /**
   * Get user's reviews
   * @param {Object} params - Query parameters (page, limit)
   */
  getUserReviews(params = {}) {
    return axios.get(`${API_URL}/reviews/user`, { params });
  },

  /**
   * Check if user can review a restaurant
   * @param {number} restaurantId - Restaurant ID
   */
  checkReviewEligibility(restaurantId) {
    return axios.get(`${API_URL}/reviews/check-eligibility/${restaurantId}`);
  },

  /**
   * Report a review
   * @param {number} reviewId - Review ID
   * @param {Object} report - Report data (reason, description)
   */
  reportReview(reviewId, report) {
    return axios.post(`${API_URL}/reviews/${reviewId}/report`, report);
  }
};

export default reviewService;