import { apiClient } from './api.service'; // Use the configured client

const restaurantService = {
  getRestaurants: async (params = {}) => {
    return apiClient.get('/api/restaurants', { params });
  },
  
  getRestaurantById: async (id) => {
    return apiClient.get(`/api/restaurants/${id}`);
  },
  
  getNearbyRestaurants: async (params = {}) => {
    return apiClient.get('/api/restaurants/nearby', { params });
  },
  
  searchRestaurants: async (params = {}) => {
    return apiClient.get('/api/restaurants/search', { params });
  },
  
  getFeaturedRestaurants: async (limit = 6) => {
    return apiClient.get('/api/restaurants/featured', {
      params: { limit }
    });
  },
  
  getRestaurantReviews: async (id, params = {}) => {
    return apiClient.get(`/api/restaurants/${id}/reviews`, { params });
  },
  
  submitRestaurantReview: async (id, reviewData) => {
    return apiClient.post(`/api/restaurants/${id}/reviews`, reviewData);
  },
  
  toggleFavorite: async (id) => {
    // Assuming favorites are handled by /api/favorites
    // This might need adjustment based on backend routes. Let's assume /api/restaurants/:id/favorite for now.
    return apiClient.post(`/api/restaurants/${id}/favorite`);
  },
  
  getFavoriteRestaurants: async () => {
    // Assuming favorites are handled by /api/favorites
    // This might need adjustment based on backend routes. Let's assume /api/restaurants/favorites for now.
    return apiClient.get('/api/restaurants/favorites');
  },
  
  getAllRestaurants: async (params = {}) => {
    return apiClient.get('/api/restaurants', { params });
  },
  
  getRestaurantMenu: async (id) => {
    return apiClient.get(`/api/restaurants/${id}/menu`);
  },
  
  searchByLocation: async (params = {}) => {
    return apiClient.get('/api/restaurants/search/location', { params });
  },
  
  getPopularRestaurants: async (params = {}) => {
    return apiClient.get('/api/restaurants/popular', { params });
  }
};

export { restaurantService };
export default restaurantService;