import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    getUser: (state) => state.user
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/login', { email, password });
        
        // Store token and user data
        this.token = response.data.token;
        this.user = response.data.user;
        
        // Save token to localStorage
        localStorage.setItem('token', this.token);
        
        // Set Authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async loginWithGoogle(idToken) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/google-login', { idToken });
        
        // Store token and user data
        this.token = response.data.token;
        this.user = response.data.user;
        
        // Save token to localStorage
        localStorage.setItem('token', this.token);
        
        // Set Authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Google login failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async loginWithFacebook(accessToken) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/facebook-login', { accessToken });
        
        // Store token and user data
        this.token = response.data.token;
        this.user = response.data.user;
        
        // Save token to localStorage
        localStorage.setItem('token', this.token);
        
        // Set Authorization header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Facebook login failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/register', userData);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async verifyEmail(token) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`/api/auth/verify-email/${token}`);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Email verification failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async resendVerificationEmail(email) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/resend-verification-email', { email });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to resend verification email';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async verifyPhoneOTP(phone, otp) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/verify-phone', { phone, otp });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Phone verification failed';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async resendPhoneOTP(phone) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/resend-phone-otp', { phone });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to resend OTP';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async forgotPassword(email) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/forgot-password', { email });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to process forgot password request';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async resetPassword(token, password) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('/api/auth/reset-password', { token, password });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to reset password';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async logout() {
      this.loading = true;
      
      try {
        // Call the logout endpoint if you want to invalidate tokens on the server
        await axios.post('/api/auth/logout');
      } catch (error) {
        // Continue with local logout even if server logout fails
        console.error('Server logout failed:', error);
      } finally {
        // Clear local authentication data
        this.token = null;
        this.user = null;
        
        // Remove token from localStorage
        localStorage.removeItem('token');
        
        // Remove Authorization header
        delete axios.defaults.headers.common['Authorization'];
        
        this.loading = false;
      }
    },
    
    async fetchUserProfile() {
      if (!this.token) return;
      
      this.loading = true;
      
      try {
        const response = await axios.get('/api/users/profile');
        this.user = response.data;
      } catch (error) {
        // If unauthorized, logout
        if (error.response?.status === 401) {
          this.logout();
        }
        this.error = error.response?.data?.message || 'Failed to fetch user profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async checkAuth() {
      // If we have a token, check if it's valid by fetching the user profile
      if (this.token) {
        await this.fetchUserProfile();
      }
    }
  }
});
