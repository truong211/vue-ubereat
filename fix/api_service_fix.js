// Recommended fix for restaurantAPI methods in api.service.js

// Restaurant API with enhanced response handling
export const restaurantAPI = {
  getAllRestaurants: async (params) => {
    try {
      const response = await apiClient.get('/api/restaurants', { params });
      
      // Normalize response to always return an array
      if (!response || !response.data) {
        console.warn('Empty response from restaurant API');
        return { data: [] };
      }
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return { data: response.data };
      } else if (response.data.restaurants && Array.isArray(response.data.restaurants)) {
        return { 
          data: response.data.restaurants,
          total: response.data.total || response.data.restaurants.length,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1
        };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return { 
          data: response.data.data,
          total: response.data.total || response.data.data.length,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1
        };
      } else if (response.data.status === 'success') {
        if (Array.isArray(response.data.data)) {
          return { 
            data: response.data.data,
            total: response.data.total || response.data.data.length,
            page: response.data.page || 1,
            totalPages: response.data.totalPages || 1
          };
        } else if (response.data.data && response.data.data.restaurants && Array.isArray(response.data.data.restaurants)) {
          return { 
            data: response.data.data.restaurants,
            total: response.data.total || response.data.data.restaurants.length,
            page: response.data.page || 1,
            totalPages: response.data.totalPages || 1
          };
        }
      }
      
      // If we can't determine the format, log it and return an empty array
      console.warn('Unknown API response format:', response.data);
      return { data: [] };
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      // Always return a consistent format even on error
      return { 
        data: [], 
        error: error.message || 'Failed to fetch restaurants'
      };
    }
  },
  
  getFeaturedRestaurants: async (limit = 5) => {
    try {
      const response = await apiClient.get('/api/restaurants/featured', { params: { limit } });
      
      // Apply the same normalization as getAllRestaurants
      if (!response || !response.data) {
        return { data: [] };
      }
      
      if (Array.isArray(response.data)) {
        return { data: response.data };
      } else if (response.data.restaurants && Array.isArray(response.data.restaurants)) {
        return { data: response.data.restaurants };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      } else if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching featured restaurants:', error);
      return { data: [], error: error.message };
    }
  },
  
  getNearbyRestaurants: async (lat, lng, radius = 5, limit = 10) => {
    try {
      const response = await apiClient.get('/api/restaurants/nearby', { 
        params: { lat, lng, radius, limit } 
      });
      
      // Apply the same normalization as getAllRestaurants
      if (!response || !response.data) {
        return { data: [] };
      }
      
      if (Array.isArray(response.data)) {
        return { data: response.data };
      } else if (response.data.restaurants && Array.isArray(response.data.restaurants)) {
        return { data: response.data.restaurants };
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      } else if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      return { data: [], error: error.message };
    }
  },
  
  // Other methods remain the same...
}; 