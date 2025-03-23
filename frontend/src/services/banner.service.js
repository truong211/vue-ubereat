import api from './api';

const BannerService = {
  /**
   * Get banners with filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getBanners(params = {}) {
    return api.get('/banners', { params });
  },

  /**
   * Get banner by ID
   * @param {number} id - Banner ID
   * @returns {Promise} - API response
   */
  getBannerById(id) {
    return api.get(`/banners/${id}`);
  },

  /**
   * Create a new banner
   * @param {FormData} data - Banner data
   * @returns {Promise} - API response
   */
  createBanner(data) {
    return api.post('/banners', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Update an existing banner
   * @param {number} id - Banner ID
   * @param {Object|FormData} data - Update data
   * @returns {Promise} - API response
   */
  updateBanner(id, data) {
    return api.put(`/banners/${id}`, data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    });
  },

  /**
   * Delete a banner
   * @param {number} id - Banner ID
   * @returns {Promise} - API response
   */
  deleteBanner(id) {
    return api.delete(`/banners/${id}`);
  }
};

export default BannerService;