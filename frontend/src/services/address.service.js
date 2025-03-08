/**
 * Address Service
 * Handles user address management and geolocation
 */

import axios from 'axios'

class AddressService {
  /**
   * Get all addresses for the current user
   * @returns {Promise<Array>} User's saved addresses
   */
  async getUserAddresses() {
    try {
      const response = await axios.get('/api/user/addresses')
      return response.data
    } catch (error) {
      console.error('Failed to get user addresses:', error)
      return []
    }
  }

  /**
   * Create a new address
   * @param {Object} addressData - Address data
   * @returns {Promise<Object>} Created address
   */
  async createAddress(addressData) {
    try {
      const response = await axios.post('/api/user/addresses', addressData)
      return response.data
    } catch (error) {
      console.error('Failed to create address:', error)
      throw error
    }
  }

  /**
   * Update an existing address
   * @param {number} id - Address ID
   * @param {Object} addressData - Updated address data
   * @returns {Promise<Object>} Updated address
   */
  async updateAddress(id, addressData) {
    try {
      const response = await axios.put(`/api/user/addresses/${id}`, addressData)
      return response.data
    } catch (error) {
      console.error('Failed to update address:', error)
      throw error
    }
  }

  /**
   * Delete an address
   * @param {number} id - Address ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAddress(id) {
    try {
      await axios.delete(`/api/user/addresses/${id}`)
      return true
    } catch (error) {
      console.error('Failed to delete address:', error)
      throw error
    }
  }

  /**
   * Set an address as default
   * @param {number} id - Address ID
   * @returns {Promise<Object>} Updated address
   */
  async setDefaultAddress(id) {
    try {
      const response = await axios.put(`/api/user/addresses/${id}/default`)
      return response.data
    } catch (error) {
      console.error('Failed to set address as default:', error)
      throw error
    }
  }

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
