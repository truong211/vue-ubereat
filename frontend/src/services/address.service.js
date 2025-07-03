/**
 * Address Service
 * Handles user address management and geolocation
 */

import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/user`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add authorization header interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export const addressService = {
  /**
   * Get all user addresses
   */
  getUserAddresses() {
    return apiClient.get('/addresses')
  },

  /**
   * Create new address
   * @param {Object} addressData - Address data
   */
  createAddress(addressData) {
    return apiClient.post('/addresses', addressData)
  },

  /**
   * Get single address
   * @param {string|number} id - Address ID
   */
  getAddress(id) {
    return apiClient.get(`/addresses/${id}`)
  },

  /**
   * Update address
   * @param {string|number} id - Address ID
   * @param {Object} addressData - Updated address data
   */
  updateAddress(id, addressData) {
    return apiClient.put(`/addresses/${id}`, addressData)
  },

  /**
   * Delete address
   * @param {string|number} id - Address ID
   */
  deleteAddress(id) {
    return apiClient.delete(`/addresses/${id}`)
  },

  /**
   * Set address as default
   * @param {string|number} id - Address ID
   */
  setDefaultAddress(id) {
    return apiClient.patch(`/addresses/${id}/default`)
  }
}

class AddressService {
  /**
   * Get user's current location
   * @returns {Promise<Object>} Location coordinates
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }

            // Try to get address from coordinates
            const address = await this.getAddressFromCoordinates(location)
            
            resolve({
              ...location,
              ...address
            })
          } catch (error) {
            console.error('Failed to process location:', error)
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          reject(new Error(`Failed to get current location: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * Get coordinates from address string (geocoding)
   * @param {string} address - Address string
   * @returns {Promise<Object>} Location coordinates
   */
  async getCoordinatesFromAddress(address) {
    try {
      const response = await axios.get('/api/geocode/address', {
        params: { address }
      })
      return response.data
    } catch (error) {
      console.error('Geocoding failed:', error)
      throw error
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   * @param {Object} location - Location coordinates { lat, lng }
   * @returns {Promise<Object>} Address object
   */
  async getAddressFromCoordinates(location) {
    try {
      const response = await axios.get('/api/geocode/reverse', {
        params: { lat: location.lat, lng: location.lng }
      })
      return response.data
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      throw error
    }
  }

  /**
   * Get address suggestions based on partial input
   * @param {string} input - Partial address input
   * @returns {Promise<Array>} Array of address suggestions
   */
  async getAddressSuggestions(input) {
    try {
      const response = await axios.get('/api/geocode/suggestions', {
        params: { input }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get address suggestions:', error)
      return []
    }
  }

  /**
   * Calculate distance between two coordinates
   * @param {Object} origin - Origin coordinates { lat, lng }
   * @param {Object} destination - Destination coordinates { lat, lng }
   * @returns {Promise<Object>} Distance and duration information
   */
  async calculateDistance(origin, destination) {
    try {
      const response = await axios.get('/api/distance', {
        params: {
          originLat: origin.lat,
          originLng: origin.lng,
          destLat: destination.lat,
          destLng: destination.lng
        }
      })
      return response.data
    } catch (error) {
      console.error('Failed to calculate distance:', error)
      throw error
    }
  }

  /**
   * Format address object to string
   * @param {Object} address - Address object
   * @returns {string} Formatted address string
   */
  formatAddressString(address) {
    const parts = []
    
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) {
      if (address.zipcode) {
        parts.push(`${address.state} ${address.zipcode}`)
      } else {
        parts.push(address.state)
      }
    } else if (address.zipcode) {
      parts.push(address.zipcode)
    }
    
    return parts.join(', ')
  }
}

export default new AddressService()
