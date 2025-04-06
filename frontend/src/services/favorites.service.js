import { apiClient } from './api.service';

class FavoritesService {
  // Favorite Foods
  async getFavoriteFoods() {
    return apiClient.get('/favorites/foods');
  }

  async addFavoriteFood(foodId) {
    return apiClient.post('/favorites/foods', { foodId });
  }

  async removeFavoriteFood(foodId) {
    return apiClient.delete(`/favorites/foods/${foodId}`);
  }

  // Favorite Restaurants
  async getFavoriteRestaurants() {
    return apiClient.get('/favorites/restaurants');
  }

  async addFavoriteRestaurant(restaurantId) {
    return apiClient.post('/favorites/restaurants', { restaurantId });
  }

  async removeFavoriteRestaurant(restaurantId) {
    return apiClient.delete(`/favorites/restaurants/${restaurantId}`);
  }

  // Personalized Recommendations
  async getPersonalizedRecommendations() {
    return apiClient.get('/recommendations/foods');
  }

  async getRestaurantRecommendations() {
    return apiClient.get('/recommendations/restaurants');
  }
}

export const favoritesService = new FavoritesService();