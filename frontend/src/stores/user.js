import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    location: null,
    loading: false,
    error: null,
    preferences: {
      radius: 10, // Default delivery radius in km
      notifications: true,
      theme: 'light'
    }
  }),

  getters: {
    userLocation: (state) => state.location,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getPreferences: (state) => state.preferences,
    deliveryRadius: (state) => state.preferences.radius
  },

  actions: {
    async updateAvatar(avatarUrl) {
      try {
        this.loading = true
        const authStore = useAuthStore()
        
        // Update the user's avatar in the auth store
        if (authStore.user) {
          authStore.user.avatar = avatarUrl
        }
        
        return avatarUrl
      } catch (error) {
        console.error('Error updating avatar:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateLocation(location) {
      try {
        this.loading = true
        
        // Validate location data
        if (!location || !location.latitude || !location.longitude) {
          throw new Error('Invalid location data')
        }

        // Store location in localStorage for persistence
        localStorage.setItem('userLocation', JSON.stringify(location))
        
        this.location = location
        this.error = null
        return location
      } catch (error) {
        this.error = error.message
        return null
      } finally {
        this.loading = false
      }
    },

    updatePreferences(preferences) {
      try {
        this.preferences = { ...this.preferences, ...preferences }
        localStorage.setItem('userPreferences', JSON.stringify(this.preferences))
      } catch (error) {
        console.error('Error updating preferences:', error)
      }
    },

    // Initialize user settings from localStorage
    initializeUserSettings() {
      try {
        const savedLocation = localStorage.getItem('userLocation')
        if (savedLocation) {
          this.location = JSON.parse(savedLocation)
        }

        const savedPreferences = localStorage.getItem('userPreferences')
        if (savedPreferences) {
          this.preferences = { ...this.preferences, ...JSON.parse(savedPreferences) }
        }
      } catch (error) {
        console.error('Error initializing user settings:', error)
      }
    }
  }
}) 