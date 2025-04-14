const state = {
  location: null,
  loading: false,
  error: null,
  preferences: {
    radius: 10, // Default delivery radius in km
    notifications: true,
    theme: 'light'
  }
};

const getters = {
  userLocation: state => state.location,
  isLoading: state => state.loading,
  error: state => state.error,
  preferences: state => state.preferences,
  deliveryRadius: state => state.preferences.radius
};

const actions = {
  updateLocation({ commit }, location) {
    try {
      commit('setLocationLoading', true);
      
      // Validate location data
      if (!location || !location.latitude || !location.longitude) {
        throw new Error('Invalid location data');
      }

      // Store location in localStorage for persistence
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      commit('setLocation', location);
      return location;
    } catch (error) {
      commit('setLocationError', error.message);
      return null;
    } finally {
      commit('setLocationLoading', false);
    }
  },

  updatePreferences({ commit }, preferences) {
    try {
      commit('setPreferences', preferences);
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  },

  // Initialize user settings from localStorage
  initializeUserSettings({ commit }) {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        commit('setLocation', JSON.parse(savedLocation));
      }

      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        commit('setPreferences', JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error initializing user settings:', error);
    }
  }
};

const mutations = {
  setLocation(state, location) {
    state.location = location;
    state.error = null;
  },
  setLocationLoading(state, loading) {
    state.loading = loading;
  },
  setLocationError(state, error) {
    state.error = error;
  },
  setPreferences(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences };
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};