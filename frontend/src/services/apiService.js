import axios from 'axios'
import { API_URL } from '@/config'

const apiService = {
  // Initialize axios instance with default config
  init() {
    axios.defaults.baseURL = API_URL
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  },

  // Set auth token
  setAuthToken(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  },

  // Generic HTTP methods
  async get(endpoint) {
    try {
      const response = await axios.get(endpoint)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async post(endpoint, data) {
    try {
      const response = await axios.post(endpoint, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async put(endpoint, data) {
    try {
      const response = await axios.put(endpoint, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  async delete(endpoint) {
    try {
      const response = await axios.delete(endpoint)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data.message || 'An error occurred'
      return {
        status: error.response.status,
        message
      }
    } else if (error.request) {
      // Request made but no response
      return {
        status: 503,
        message: 'Service unavailable'
      }
    } else {
      // Error setting up request
      return {
        status: 500,
        message: error.message
      }
    }
  }
}

// Initialize the service
apiService.init()

export default apiService 