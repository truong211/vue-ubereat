import { apiService } from './api.service';

class FavoritesService {
  // Favorite Foods
  async getFavoriteFoods() {
    return apiService.get('/favorites/foods');
  }
  
  async addFavoriteFood(foodId) {
    return apiService.post('/favorites/foods', { foodId });
  }
  
  async removeFavoriteFood(foodId) {
    return apiService.delete(`/favorites/foods/${foodId}`);
  }
  
  // Favorite Restaurants
  async getFavoriteRestaurants() {
    return apiService.get('/favorites/restaurants');
  }
  
  async addFavoriteRestaurant(restaurantId) {
    return apiService.post('/favorites/restaurants', { restaurantId });
  }
  
  async removeFavoriteRestaurant(restaurantId) {
    return apiService.delete(`/favorites/restaurants/${restaurantId}`);
  }
  
  // Personalized Recommendations
  async getPersonalizedRecommendations() {
    return apiService.get('/recommendations/foods');
  }
  
  async getRestaurantRecommendations() {
    return apiService.get('/recommendations/restaurants');
  }
}

export const favoritesService = new FavoritesService(); 