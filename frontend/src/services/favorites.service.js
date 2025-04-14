import { apiClient } from './api.service';

export const favoritesService = {
    // Get user's favorite foods
    async getFavoriteFoods() {
        try {
            const response = await apiClient.get('/api/favorites/foods');
            return response.data;
        } catch (error) {
            console.error('Error fetching favorite foods:', error);
            throw error;
        }
    },

    // Add a food to favorites
    async addToFavorites(foodId) {
        try {
            const response = await apiClient.post(`/api/favorites/foods/${foodId}`);
            return response.data;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            throw error;
        }
    },

    // Remove a food from favorites
    async removeFromFavorites(foodId) {
        try {
            const response = await apiClient.delete(`/api/favorites/foods/${foodId}`);
            return response.data;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            throw error;
        }
    }
};

export default favoritesService;