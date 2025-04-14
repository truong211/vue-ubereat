import { apiClient } from './api.service'; // Use the configured client

export default {
  /**
   * Get all static pages
   * @returns {Promise} Promise object with array of pages
   */
  getPages() {
    return apiClient.get('/api/pages'); // Path needs /api prefix
  },

  /**
   * Get a single page by slug
   * @param {string} slug - The page slug
   * @returns {Promise} Promise object with page data
   */
  getPageBySlug(slug) {
    return apiClient.get(`/api/pages/${slug}`); // Path needs /api prefix
  }
};