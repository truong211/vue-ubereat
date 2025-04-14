import axios from 'axios';

// Convert to class for proper instantiation
class JwtAuth {
  constructor() {
    // Constants for token storage keys
    this.TOKEN_KEY = 'token';
    this.REFRESH_TOKEN_KEY = 'refresh_token';
    this.init();
  }

  // Initialize axios interceptors for JWT
  init() {
    // Configure axios defaults
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.post['Content-Type'] = 'application/json';
    
    // Add request interceptor for auth header
    axios.interceptors.request.use(
      (config) => {
        // Add Authorization header if token exists
        const token = this.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add logging for debugging
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        console.log('Request headers:', config.headers);
        console.log('Request data:', config.data);

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling errors
    axios.interceptors.response.use(
      (response) => {
        console.log('Response received:', response.status, response.data);
        return response;
      },
      async (error) => {
        console.error('Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Set auth header
  setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  // Set tokens in localStorage
  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      this.setAuthHeader(accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  // Get access token
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Clear tokens from localStorage
  clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');
    this.setAuthHeader(null);
  }

  // Login user
  async login(email, password) {
    try {
      console.log('Attempting login with:', { email });

      const response = await axios.post('/api/auth/login',
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
          timeout: 5000 // 5 second timeout
        }
      );

      console.log('Login response:', response.data);

      if (response.status === 401) {
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      if (response.status === 500) {
        const errorMessage = response.data?.message || 'Internal server error';
        if (response.data?.code === 'ECONNREFUSED') {
          throw new Error('Unable to connect to the backend server. Please ensure it is running on port 3000.');
        }
        throw new Error(errorMessage);
      }

      if (response.status !== 200) {
        throw new Error(response.data?.message || 'Login failed');
      }

      const { token: accessToken, refreshToken, user } = response.data;

      if (!accessToken) {
        throw new Error('Authentication failed: No access token received');
      }

      // Store tokens
      this.setTokens(accessToken, refreshToken);
      
      // Store user data
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return response.data;

    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });

      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please try again.');
      }
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your connection and ensure the backend server is running.');
      }
      
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await axios.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }
}

export default JwtAuth;