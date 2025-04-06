import { apiClient } from './api.service';
import { PRODUCT } from './api.endpoints';

/**
 * Product Service
 * Handles all API calls related to products
 */
const productService = {
  /**
   * Get all products with filters
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} - Promise with product data
   */
  getProducts(params = {}) {
    return apiClient.get(PRODUCT.ALL, { params });
  },

  /**
   * Get product by ID
   * @param {Number|String} id - Product ID
   * @returns {Promise} - Promise with product details
   */
  getProductById(id) {
    return apiClient.get(PRODUCT.DETAILS(id));
  },

  /**
   * Get product details with options
   * @param {Number|String} id - Product ID
   * @returns {Promise} - Promise with detailed product information including options
   */
  getProductDetails(id) {
    return apiClient.get(PRODUCT.DETAILS(id));
  },

  /**
   * Get product reviews
   * @param {Number|String} id - Product ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise} - Promise with product reviews
   */
  getProductReviews(id, params = {}) {
    return apiClient.get(`${PRODUCT.DETAILS(id)}/reviews`, { params });
  },

  /**
   * Get popular products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with popular products
   */
  getPopularProducts(params = {}) {
    return apiClient.get(PRODUCT.POPULAR, { params });
  },

  /**
   * Get recommended products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with recommended products
   */
  getRecommendedProducts(params = {}) {
    return apiClient.get(PRODUCT.RECOMMENDED, { params });
  },

  /**
   * Search products
   * @param {String} query - Search query
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise with search results
   */
  searchProducts(query, params = {}) {
    return apiClient.get(PRODUCT.SEARCH, {
      params: {
        query,
        ...params
      }
    });
  },

  /**
   * Get products by category
   * @param {Number|String} categoryId - Category ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise with products in category
   */
  getProductsByCategory(categoryId, params = {}) {
    return apiClient.get(PRODUCT.ALL, {
      params: {
        categoryId,
        ...params
      }
    });
  },

  /**
   * Get products by restaurant
   * @param {Number|String} restaurantId - Restaurant ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise with products from restaurant
   */
  getProductsByRestaurant(restaurantId, params = {}) {
    return apiClient.get(PRODUCT.ALL, {
      params: {
        restaurantId,
        ...params
      }
    });
  },

  /**
   * Submit a product review
   * @param {FormData} formData - Review data with possible images
   * @returns {Promise} - Promise with review submission result
   */
  submitReview(formData) {
    return apiClient.post(`/reviews`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Mark a review as helpful
   * @param {Number|String} reviewId - Review ID
   * @returns {Promise} - Promise with result
   */
  markReviewHelpful(reviewId) {
    return apiClient.post(`/api/reviews/${reviewId}/helpful`);
  },

  /**
   * Delete a review
   * @param {Number|String} reviewId - Review ID
   * @returns {Promise} - Promise with result
   */
  deleteReview(reviewId) {
    return apiClient.delete(`/api/reviews/${reviewId}`);
  }
};

export default productService;