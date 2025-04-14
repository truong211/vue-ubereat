import { defineStore } from 'pinia';

export const useLocationStore = defineStore('location', {
  state: () => ({
    currentAddress: null,
    coordinates: {
      latitude: null,
      longitude: null
    },
    loading: false,
    error: null
  }),

  getters: {
    hasLocation: state => state.coordinates.latitude !== null && state.coordinates.longitude !== null
  },

  actions: {
    setLocation(location) {
      if (!location) return;
      
      this.coordinates = {
        latitude: location.latitude,
        longitude: location.longitude
      };
      this.currentAddress = location.address;
      this.error = null;

      // Save to localStorage for persistence
      localStorage.setItem('userLocation', JSON.stringify({
        coordinates: this.coordinates,
        address: this.currentAddress
      }));
    },

    async initializeLocation() {
      try {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          const parsed = JSON.parse(savedLocation);
          this.coordinates = parsed.coordinates;
          this.currentAddress = parsed.address;
        }
      } catch (error) {
        console.error('Error initializing location:', error);
      }
    },

    clearLocation() {
      this.coordinates = {
        latitude: null,
        longitude: null
      };
      this.currentAddress = null;
      localStorage.removeItem('userLocation');
    },

    setError(error) {
      this.error = error;
    }
  }
});
