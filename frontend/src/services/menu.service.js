import api from './api';

const menuService = {
  getMenuCategories: async (restaurantId) => {
    return api.get(`/restaurants/${restaurantId}/menu-categories`);
  },
  
  getMenuItems: async (restaurantId, params = {}) => {
    return api.get(`/restaurants/${restaurantId}/menu-items`, { params });
  },
  
  getMenuItemById: async (restaurantId, itemId) => {
    return api.get(`/restaurants/${restaurantId}/menu-items/${itemId}`);
  },
  
  getPopularItems: async (restaurantId, limit = 5) => {
    return api.get(`/restaurants/${restaurantId}/popular-items`, { 
      params: { limit } 
    });
  },
  
  getRecommendedItems: async (restaurantId, userId, limit = 5) => {
    return api.get(`/restaurants/${restaurantId}/recommended-items`, { 
      params: { userId, limit } 
    });
  }
};

export default menuService; 