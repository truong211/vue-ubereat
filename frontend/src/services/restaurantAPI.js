import { apiClient } from './api.service';

// Restaurant API service
const restaurantAPI = {
  // Get all restaurants
  getAllRestaurants: () => {
    return apiClient.get('/api/restaurants');
  },

  // Get restaurant by ID
  getRestaurant: (id) => {
    return apiClient.get(`/api/restaurants/${id}`);
  },

  // Get restaurant menu
  getRestaurantMenu: (id) => {
    return apiClient.get(`/api/restaurants/${id}/menu`);
  },

  // Get restaurant reviews
  getRestaurantReviews: (id) => {
    return apiClient.get(`/api/restaurants/${id}/reviews`);
  },

  // Add restaurant review
  addRestaurantReview: (id, reviewData) => {
    return apiClient.post(`/api/restaurants/${id}/reviews`, reviewData);
  },

  // Search restaurants
  searchRestaurants: (query) => {
    return apiClient.get('/api/restaurants/search', { params: { q: query } });
  },

  // Get restaurants by category
  getRestaurantsByCategory: (categoryId) => {
    return apiClient.get('/api/restaurants', { params: { categoryId } });
  },

  // Get featured restaurants
  getFeaturedRestaurants: () => {
    return apiClient.get('/api/restaurants/featured');
  },

  // Get nearby restaurants
  getNearbyRestaurants: (lat, lng, radius = 5000) => {
    return apiClient.get('/api/restaurants/nearby', {
      params: { lat, lng, radius }
    });
  }
};

export default restaurantAPI; 