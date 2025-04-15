import JwtAuth from '@/services/jwt-auth'
import router from '@/router'
import axios from 'axios'

// Create a single instance of JwtAuth
const jwtAuth = new JwtAuth()

export default {
  namespaced: true,
  
  state: {
    accessToken: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refresh_token'),
    user: null,
    loading: false
  },

  getters: {
    isAuthenticated: (state) => {
      return !!state.accessToken && !!state.user
    },
    
    userRole: (state) => {
      return state.user?.role
    },

    token: (state) => state.accessToken
  },

  mutations: {
    SET_ACCESS_TOKEN(state, token) {
      state.accessToken = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    
    SET_REFRESH_TOKEN(state, token) {
      state.refreshToken = token
      if (token) {
        localStorage.setItem('refresh_token', token)
      } else {
        localStorage.removeItem('refresh_token')
      }
    },
    
    SET_USER(state, user) {
      state.user = user
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    CLEAR_AUTH(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
    }
  },

  actions: {
    async initialize({ state, dispatch }) {
      if (state.accessToken) {
        jwtAuth.setAuthHeader(state.accessToken)
        await dispatch('checkAuth')
      }
    },

    async checkAuth({ state, commit, dispatch }) {
      if (!state.accessToken) return

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${state.accessToken}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load user profile')
        }
        
        const user = await response.json()
        commit('SET_USER', user)
        return user
      } catch (error) {
        console.error('Failed to load user:', error)
        await dispatch('clearTokens')
        throw error
      }
    },

    setTokens({ commit }, { accessToken, refreshToken }) {
      commit('SET_ACCESS_TOKEN', accessToken)
      commit('SET_REFRESH_TOKEN', refreshToken)
      
      jwtAuth.setTokens(accessToken, refreshToken)
    },

    clearTokens({ commit }) {
      commit('CLEAR_AUTH')
      jwtAuth.clearTokens()
    },

    async login({ dispatch }, credentials) {
      try {
        const { email, password } = credentials;
        console.log('Attempting login with:', { email }); // Debug log
        
        const response = await axios.post('/api/auth/login', { email, password });
        console.log('Login response:', response.data); // Debug log
        
        if (response.data.token) {
          await dispatch('setTokens', {
            accessToken: response.data.token,
            refreshToken: response.data.refreshToken
          });
          await dispatch('checkAuth');
          return response.data;
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        await dispatch('clearTokens');
        throw error;
      }
    },

    async register({ dispatch }, registrationData) {
      try {
        const tokens = await jwtAuth.register(registrationData)
        await dispatch('setTokens', tokens)
        await dispatch('checkAuth')
        await router.push('/')
      } catch (error) {
        await dispatch('clearTokens')
        throw error
      }
    },

    async logout({ commit }) {
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          await axios.post('/api/auth/logout', { refreshToken })
        }
      } catch (error) {
        console.warn('Error during logout:', error)
      } finally {
        commit('CLEAR_AUTH')
        await router.push('/login')
      }
    },

    async refreshToken({ state, commit }) {
      try {
        const refreshToken = state.refreshToken
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post('/api/auth/refresh-token', { refreshToken })
        const { token: accessToken, refreshToken: newRefreshToken } = response.data

        commit('SET_ACCESS_TOKEN', accessToken)
        if (newRefreshToken) {
          commit('SET_REFRESH_TOKEN', newRefreshToken)
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        return response.data
      } catch (error) {
        commit('CLEAR_AUTH')
        throw error
      }
    },

    async fetchUser({ commit, state }) {
      if (!state.accessToken) return null
      
      try {
        const response = await axios.get('/api/auth/me')
        const user = response.data
        commit('SET_USER', user)
        return user
      } catch (error) {
        console.error('Error fetching user:', error)
        if (error.response?.status === 401) {
          commit('CLEAR_AUTH')
        }
        throw error
      }
    }
  }
}

export function useAuthStore() {
  // Return the store instance with all actions and state
  return {
    login: async (credentials) => {
      const store = window.$nuxt.$store;
      return store.dispatch('auth/login', credentials);
    },
    loginWithSocial: async (payload) => {
      const store = window.$nuxt.$store;
      return store.dispatch('auth/loginWithSocial', payload);
    },
    logout: async () => {
      const store = window.$nuxt.$store;
      return store.dispatch('auth/logout');
    },
    refreshToken: async () => {
      const store = window.$nuxt.$store;
      return store.dispatch('auth/refreshToken');
    }
  };
}
