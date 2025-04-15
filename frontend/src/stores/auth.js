import { defineStore } from 'pinia'
import axios from 'axios'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refresh_token'),
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role || null
  },

  actions: {
    async login(credentials) {
      this.loading = true;
      try {
        console.log('Attempting login with:', { email: credentials.email });
        const response = await axios.post('/api/auth/login', credentials);
        console.log('Login response:', response.data);

        if (response.data.token) {
          this.setAuthData(response.data.token, response.data.user);
          await this.fetchUser();
          return response.data;
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        this.clearAuth();
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      try {
        const response = await axios.post('/api/auth/register', userData)
        const { token, user } = response.data
        this.setAuthData(token, user)
        return { success: true }
      } catch (error) {
        console.error('Registration error:', error)
        throw error
      }
    },

    setAuthData(token, user) {
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Auth data set:', { token: !!token, user: !!user, isAuthenticated: this.isAuthenticated });
    },

    clearAuth() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      console.log('Auth cleared');
    },

    async loginWithSocial({ provider, ...data }) {
      this.loading = true;
      try {
        const response = await axios.post(`/api/auth/social/${provider}`, data);
        if (response.data.token) {
          this.setAuthData(response.data.token, response.data.user);
          return response.data;
        }
        throw new Error('Invalid social login response');
      } catch (error) {
        this.clearAuth();
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await axios.post('/api/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuth();
        router.push('/login');
      }
    },

    async fetchUser() {
      try {
        const response = await axios.get('/api/auth/me')
        this.user = response.data.user
        this.isAuthenticated = true
        return response.data
      } catch (error) {
        this.logout()
        throw error
      }
    }
  }
}) 