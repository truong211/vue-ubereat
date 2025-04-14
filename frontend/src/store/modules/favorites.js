import { favoritesService } from '@/services/favorites.service';

export default {
    namespaced: true,
    
    state: {
        favorites: [],
        loading: false,
        error: null
    },

    mutations: {
        SET_FAVORITES(state, favorites) {
            state.favorites = favorites;
        },
        SET_LOADING(state, status) {
            state.loading = status;
        },
        SET_ERROR(state, error) {
            state.error = error;
        },
        ADD_FAVORITE(state, favorite) {
            state.favorites.push(favorite);
        },
        REMOVE_FAVORITE(state, foodId) {
            state.favorites = state.favorites.filter(f => f.food_id !== foodId);
        }
    },

    actions: {
        async fetchFavorites({ commit }) {
            commit('SET_LOADING', true);
            commit('SET_ERROR', null);
            
            try {
                const response = await favoritesService.getFavoriteFoods();
                commit('SET_FAVORITES', response.data);
            } catch (error) {
                commit('SET_ERROR', error.message || 'Failed to fetch favorites');
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async addToFavorites({ commit }, foodId) {
            commit('SET_ERROR', null);
            
            try {
                await favoritesService.addToFavorites(foodId);
                // Refresh favorites list after adding
                const response = await favoritesService.getFavoriteFoods();
                commit('SET_FAVORITES', response.data);
            } catch (error) {
                commit('SET_ERROR', error.message || 'Failed to add to favorites');
                throw error;
            }
        },

        async removeFromFavorites({ commit }, foodId) {
            commit('SET_ERROR', null);
            
            try {
                await favoritesService.removeFromFavorites(foodId);
                commit('REMOVE_FAVORITE', foodId);
            } catch (error) {
                commit('SET_ERROR', error.message || 'Failed to remove from favorites');
                throw error;
            }
        }
    },

    getters: {
        isFavorite: (state) => (foodId) => {
            return state.favorites.some(f => f.food_id === foodId);
        },
        getFavorites: (state) => state.favorites,
        isLoading: (state) => state.loading,
        getError: (state) => state.error
    }
};