import axios from 'axios';
import { API_URL } from '../config';

const API_ENDPOINT = `${API_URL}/restaurants`;

/**
 * Restaurant Service for handling all restaurant-related API calls
 */
export const restaurantService = {
  /**
   * Get all restaurants with optional filtering
   * @param {Object} params - Query parameters for filtering restaurants
   * @returns {Promise} - Promise with restaurant data
   */
  getAllRestaurants(params = {}) {
    return axios.get(API_ENDPOINT, { params });
  },
  
  /**
   * Get restaurant by ID
   * @param {string|number} id - Restaurant ID
   * @param {Object} params - Optional query parameters (e.g., user location)
   * @returns {Promise} - Promise with restaurant data
   */
  getRestaurantById(id, params = {}) {
    return axios.get(`${API_ENDPOINT}/${id}`, { params });
  },
  
  /**
   * Get restaurant menu
   * @param {string|number} id - Restaurant ID
   * @returns {Promise} - Promise with menu data
   */
  getRestaurantMenu(id) {
    return axios.get(`${API_ENDPOINT}/${id}/menu`);
  },
  
  /**
   * Get restaurant reviews
   * @param {string|number} id - Restaurant ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise} - Promise with reviews data
   */
  getRestaurantReviews(id, params = {}) {
    return axios.get(`${API_ENDPOINT}/${id}/reviews`, { params });
  },
  
  /**
   * Search restaurants by location
   * @param {Object} params - Query parameters including latitude, longitude, radius
   * @returns {Promise} - Promise with nearby restaurant data
   */
  searchByLocation(params = {}) {
    return axios.get(`${API_ENDPOINT}/search`, { params });
  },
  
  /**
   * Get featured restaurants
   * @param {Object} params - Query parameters (can include user location)
   * @returns {Promise} - Promise with featured restaurant data
   */
  getFeaturedRestaurants(params = {}) {
    return axios.get(`${API_ENDPOINT}/featured`, { params });
  },
  
  /**
   * Get popular restaurants
   * @param {Object} params - Query parameters (limit, etc.)
   * @returns {Promise} - Promise with popular restaurant data
   */
  getPopularRestaurants(params = {}) {
    return axios.get(`${API_ENDPOINT}/popular`, { params });
  },
  
  /**
   * Create a new restaurant (for restaurant owners)
   * @param {Object} data - Restaurant data
   * @returns {Promise} - Promise with created restaurant data
   */
  createRestaurant(data) {
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(data).forEach(key => {
      if (key !== 'logo' && key !== 'coverImage') {
        if (typeof data[key] === 'object' && data[key] !== null) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    // Add images if provided
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    if (data.coverImage) {
      formData.append('coverImage', data.coverImage);
    }
    
    return axios.post(API_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  /**
   * Update an existing restaurant
   * @param {string|number} id - Restaurant ID
   * @param {Object} data - Updated restaurant data
   * @returns {Promise} - Promise with updated restaurant data
   */
  updateRestaurant(id, data) {
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(data).forEach(key => {
      if (key !== 'logo' && key !== 'coverImage') {
        if (typeof data[key] === 'object' && data[key] !== null) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    // Add images if provided
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    if (data.coverImage) {
      formData.append('coverImage', data.coverImage);
    }
    
    return axios.patch(`${API_ENDPOINT}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  /**
   * Delete a restaurant
   * @param {string|number} id - Restaurant ID
   * @returns {Promise} - Empty promise on success
   */
  deleteRestaurant(id) {
    return axios.delete(`${API_ENDPOINT}/${id}`);
  }
};