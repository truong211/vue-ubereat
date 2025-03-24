import { apiService } from '@/services/api.service';

export default {
  namespaced: true,
  
  state: {
    favoriteFoods: [],
    favoriteRestaurants: [],
    loading: false,
    error: null,
    recommendations: [],
    loadingRecommendations: false
  },
  
  getters: {
    getFavoriteFoods: state => state.favoriteFoods,
    getFavoriteRestaurants: state => state.favoriteRestaurants,
    getRecommendations: state => state.recommendations,
    isLoading: state => state.loading,
    isLoadingRecommendations: state => state.loadingRecommendations,
    hasError: state => !!state.error,
    getError: state => state.error
  },
  
  mutations: {
    SET_LOADING(state, status) {
      state.loading = status;
    },
    
    SET_ERROR(state, error) {
      state.error = error;
    },
    
    SET_FAVORITE_FOODS(state, foods) {
      state.favoriteFoods = foods;
    },
    
    SET_FAVORITE_RESTAURANTS(state, restaurants) {
      state.favoriteRestaurants = restaurants;
    },
    
    ADD_FAVORITE_FOOD(state, food) {
      if (!state.favoriteFoods.some(item => item.id === food.id)) {
        state.favoriteFoods.push(food);
      }
    },
    
    REMOVE_FAVORITE_FOOD(state, foodId) {
      state.favoriteFoods = state.favoriteFoods.filter(food => food.id !== foodId);
    },
    
    ADD_FAVORITE_RESTAURANT(state, restaurant) {
      if (!state.favoriteRestaurants.some(item => item.id === restaurant.id)) {
        state.favoriteRestaurants.push(restaurant);
      }
    },
    
    REMOVE_FAVORITE_RESTAURANT(state, restaurantId) {
      state.favoriteRestaurants = state.favoriteRestaurants.filter(restaurant => restaurant.id !== restaurantId);
    },
    
    SET_RECOMMENDATIONS(state, recommendations) {
      state.recommendations = recommendations;
    },
    
    SET_LOADING_RECOMMENDATIONS(state, status) {
      state.loadingRecommendations = status;
    }
  },
  
  actions: {
    // Fetch user's favorite foods
    async fetchFavoriteFoods({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await apiService.get('/favorites/foods');
        commit('SET_FAVORITE_FOODS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch favorite foods');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Fetch user's favorite restaurants
    async fetchFavoriteRestaurants({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await apiService.get('/favorites/restaurants');
        commit('SET_FAVORITE_RESTAURANTS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch favorite restaurants');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Toggle food favorite status
    async toggleFavoriteFood({ commit, state }, food) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      const isFavorite = state.favoriteFoods.some(item => item.id === food.id);
      
      try {
        if (isFavorite) {
          await apiService.delete(`/favorites/foods/${food.id}`);
          commit('REMOVE_FAVORITE_FOOD', food.id);
        } else {
          await apiService.post('/favorites/foods', { foodId: food.id });
          commit('ADD_FAVORITE_FOOD', food);
        }
        return !isFavorite;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to update favorite foods');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Toggle restaurant favorite status
    async toggleFavoriteRestaurant({ commit, state }, restaurant) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      const isFavorite = state.favoriteRestaurants.some(item => item.id === restaurant.id);
      
      try {
        if (isFavorite) {
          await apiService.delete(`/favorites/restaurants/${restaurant.id}`);
          commit('REMOVE_FAVORITE_RESTAURANT', restaurant.id);
        } else {
          await apiService.post('/favorites/restaurants', { restaurantId: restaurant.id });
          commit('ADD_FAVORITE_RESTAURANT', restaurant);
        }
        return !isFavorite;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to update favorite restaurants');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Get personalized food recommendations based on order history
    async getPersonalizedRecommendations({ commit }) {
      commit('SET_LOADING_RECOMMENDATIONS', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await apiService.get('/recommendations/foods');
        commit('SET_RECOMMENDATIONS', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch recommendations');
        throw error;
      } finally {
        commit('SET_LOADING_RECOMMENDATIONS', false);
      }
    }
  }
}; 