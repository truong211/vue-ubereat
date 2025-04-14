import { defineStore } from 'pinia'

export const useLocationStore = defineStore('location', {
  state: () => ({
    currentAddress: null,
    savedAddresses: [],
    isLoading: false,
    error: null
  }),

  getters: {
    hasAddress: (state) => !!state.currentAddress,
    
    formattedAddress: (state) => {
      if (!state.currentAddress) return ''
      return state.currentAddress
    }
  },

  actions: {
    setCurrentAddress(address) {
      this.currentAddress = address
      // Save to localStorage for persistence
      localStorage.setItem('lastKnownAddress', address)
    },

    addSavedAddress(address) {
      if (!this.savedAddresses.includes(address)) {
        this.savedAddresses.push(address)
        // Save to localStorage for persistence
        localStorage.setItem('savedAddresses', JSON.stringify(this.savedAddresses))
      }
    },

    removeSavedAddress(address) {
      const index = this.savedAddresses.indexOf(address)
      if (index > -1) {
        this.savedAddresses.splice(index, 1)
        // Update localStorage
        localStorage.setItem('savedAddresses', JSON.stringify(this.savedAddresses))
      }
    },

    async detectCurrentLocation() {
      this.isLoading = true
      this.error = null

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })

        // Here you would typically make an API call to convert coordinates to address
        // For now, we'll just store the coordinates
        const address = `${position.coords.latitude}, ${position.coords.longitude}`
        this.setCurrentAddress(address)
      } catch (error) {
        this.error = error.message || 'Failed to detect location'
        console.error('Location detection error:', error)
      } finally {
        this.isLoading = false
      }
    },

    initializeFromStorage() {
      // Load saved addresses from localStorage
      const savedAddresses = localStorage.getItem('savedAddresses')
      if (savedAddresses) {
        this.savedAddresses = JSON.parse(savedAddresses)
      }

      // Load last known address from localStorage
      const lastKnownAddress = localStorage.getItem('lastKnownAddress')
      if (lastKnownAddress) {
        this.currentAddress = lastKnownAddress
      }
    }
  }
})
