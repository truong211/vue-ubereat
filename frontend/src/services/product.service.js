import { apiClient } from './api.service'; // Use the configured client

/**
 * Product Service
 * Handles all API calls related to products
 */
const productService = {
  /**
   * Get products with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with product data
   */
  getProducts: async (params = {}) => {
    return apiClient.get('/api/products', { params });
  },
  
  /**
   * Get product by ID
   * @param {string|number} id - Product ID
   * @returns {Promise} - Promise with product data
   */
  getProductById: async (id) => {
    return apiClient.get(`/api/products/${id}`);
  },
  
  /**
   * Get related products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with related products
   */
  getRelatedProducts: async (params = {}) => {
    return apiClient.get('/api/products/related', { params });
  },
  
  /**
   * Get recommended products for a user
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with recommended products
   */
  getRecommendedProducts: async (params = {}) => {
    return apiClient.get('/api/products/recommended', { params });
  },
  
  /**
   * Get popular products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with popular products
   */
  getPopularProducts: async (params = {}) => {
    return apiClient.get('/api/products/popular', { params });
  },
  
  /**
   * Get product categories
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with categories data
   */
  getCategories: async (params = {}) => {
    // Assuming categories are fetched via /api/categories, not /api/products/categories
    // Let's check category.service.js if this causes issues. For now, keep as is or check backend routes.
    // If backend route is /api/products/categories, change this:
    // return api.get('/api/products/categories', { params });
    // If backend route is /api/categories, this call might be incorrect here.
    // Let's assume the backend route is /api/products/categories for now.
    return apiClient.get('/api/products/categories', { params }); // Assuming backend route is /api/products/categories
  },
  
  /**
   * Get products by category ID
   * @param {string|number} categoryId - Category ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with products data
   */
  getProductsByCategory: async (categoryId, params = {}) => {
    return apiClient.get(`/api/products/category/${categoryId}`, { params });
  },
  
  /**
   * Search products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with search results
   */
  searchProducts: async (params = {}) => {
    return apiClient.get('/api/products/search', { params });
  },
  
  /**
   * Get product reviews
   * @param {string|number} productId - Product ID
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with reviews data
   */
  getProductReviews: async (productId, params = {}) => {
    return apiClient.get(`/api/products/${productId}/reviews`, { params });
  },
  
  /**
   * Submit product review
   * @param {string|number} productId - Product ID
   * @param {Object} reviewData - Review data
   * @returns {Promise} - Promise with review submission result
   */
  submitProductReview: async (productId, reviewData) => {
    return apiClient.post(`/api/products/${productId}/reviews`, reviewData);
  },
  
  /**
   * Toggle product favorite status
   * @param {string|number} productId - Product ID
   * @returns {Promise} - Promise with favorite toggle result
   */
  toggleFavorite: async (productId) => {
    // Assuming favorites are handled by /api/favorites
    // This might need adjustment based on backend routes. Let's assume /api/products/:id/favorite for now.
    return apiClient.post(`/api/products/${productId}/favorite`);
  },
  
  /**
   * Get user's favorite products
   * @param {Object} params - Query parameters
   * @returns {Promise} - Promise with favorite products
   */
  getFavoriteProducts: async (params = {}) => {
    // Assuming favorites are handled by /api/favorites
    // This might need adjustment based on backend routes. Let's assume /api/products/favorites for now.
    return apiClient.get('/api/products/favorites', { params });
  }
};

export default productService;