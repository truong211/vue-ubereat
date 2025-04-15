import axios from 'axios';

// In development, axios will use the proxy configured in vite.config.ts
// In production, it will use the VITE_API_URL environment variable
const baseURL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL;

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle 401 errors globally
      console.error('Authentication error:', error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
