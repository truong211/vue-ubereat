import api from './api';

const ArticleService = {
  /**
   * Get articles with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getArticles(params = {}) {
    return api.get('/articles', { params });
  },

  /**
   * Get article by ID
   * @param {number} id - Article ID
   * @returns {Promise} - API response
   */
  getArticleById(id) {
    return api.get(`/articles/${id}`);
  },

  /**
   * Get article by slug
   * @param {string} slug - Article slug
   * @returns {Promise} - API response
   */
  getArticleBySlug(slug) {
    return api.get(`/articles/slug/${slug}`);
  },

  /**
   * Create a new article
   * @param {Object|FormData} data - Article data
   * @returns {Promise} - API response
   */
  createArticle(data) {
    return api.post('/articles', data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    });
  },

  /**
   * Update an existing article
   * @param {number} id - Article ID
   * @param {Object|FormData} data - Update data
   * @returns {Promise} - API response
   */
  updateArticle(id, data) {
    return api.put(`/articles/${id}`, data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    });
  },

  /**
   * Delete an article
   * @param {number} id - Article ID
   * @returns {Promise} - API response
   */
  deleteArticle(id) {
    return api.delete(`/articles/${id}`);
  }
};

export default ArticleService;