import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export default {
  // Initialize axios interceptors for JWT
  init() {
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            this.setToken(newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  },

  // Setup axios interceptor for automatic token refresh
  setupInterceptors(
    getRefreshToken,
    onRefreshSuccess,
    onRefreshError
  ) {
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        // If the error is not 401 or the request was for refresh, reject
        if (
          error.response?.status !== 401 ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest._retry
        ) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const newAccessToken = await this.refreshToken();
          onRefreshSuccess(newAccessToken);
          this.setAuthHeader(newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          return axios(originalRequest);
        } catch (refreshError) {
          onRefreshError();
          return Promise.reject(refreshError);
        }
      }
    );
  },

  // Set auth header
  setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  // Set tokens in localStorage
  setTokens(token, refreshToken) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  // Get access token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Clear tokens from localStorage
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/auth/refresh-token', {
        refreshToken
      });

      const { token, newRefreshToken } = response.data;
      this.setTokens(token, newRefreshToken);
      return token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, refreshToken, user } = response.data;
      this.setTokens(token, refreshToken);
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await axios.post('/api/auth/logout', {
        refreshToken: this.getRefreshToken()
      });
      this.clearTokens();
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
};