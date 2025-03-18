import axios from 'axios';

class ReviewService {
  async getRestaurantReviews(restaurantId, options = {}) {
    const { page = 1, limit = 10, sort = 'recent' } = options;
    const response = await axios.get(`/api/reviews/restaurant/${restaurantId}`, {
      params: { page, limit, sort }
    });
    return response.data;
  }

  async getProductReviews(productId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const response = await axios.get(`/api/reviews/product/${productId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getUserReviews(options = {}) {
    const { page = 1, limit = 10 } = options;
    const response = await axios.get('/api/reviews/user', {
      params: { page, limit }
    });
    return response.data;
  }

  async createReview(reviewData) {
    const response = await axios.post('/api/reviews', reviewData);
    return response.data;
  }

  async updateReview(reviewId, updateData) {
    const response = await axios.put(`/api/reviews/${reviewId}`, updateData);
    return response.data;
  }

  async deleteReview(reviewId) {
    const response = await axios.delete(`/api/reviews/${reviewId}`);
    return response.data;
  }

  async respondToReview(reviewId, response) {
    const result = await axios.post(`/api/reviews/${reviewId}/respond`, { response });
    return result.data;
  }

  async getReviewStats() {
    const response = await axios.get('/api/reviews/dashboard/stats');
    return response.data;
  }

  // Add a photo to a review
  async addReviewPhoto(reviewId, photoData) {
    const formData = new FormData();
    formData.append('photo', photoData);
    
    const response = await axios.post(`/api/reviews/${reviewId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // Remove a photo from a review
  async removeReviewPhoto(reviewId, photoId) {
    const response = await axios.delete(`/api/reviews/${reviewId}/photos/${photoId}`);
    return response.data;
  }
}

export default new ReviewService();