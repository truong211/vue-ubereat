import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/user`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const userProfileService = {
  /**
   * Get user profile
   */
  getProfile() {
    return apiClient.get('/profile');
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   */
  updateProfile(profileData) {
    return apiClient.put('/profile', profileData);
  },

  /**
   * Upload user avatar
   * @param {File} file - Avatar image file
   */
  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiClient.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Remove user avatar
   */
  removeAvatar() {
    return apiClient.delete('/profile/avatar');
  }
};