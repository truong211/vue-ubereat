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
    user: null
  },

  getters: {
    isAuthenticated: (state) => {
      return !!state.accessToken && !!state.user
    },
    
    userRole: (state) => {
      return state.user?.role
    }
  },

  mutations: {
    SET_ACCESS_TOKEN(state, token) {
      state.accessToken = token
    },
    SET_REFRESH_TOKEN(state, token) {
      state.refreshToken = token
    },
    SET_USER(state, user) {
      state.user = user
    },
    CLEAR_AUTH(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
    }
  },

  actions: {
    async initialize({ state, dispatch }) {
      if (state.accessToken) {
        jwtAuth.setAuthHeader(state.accessToken)
        await dispatch('checkAuth')
      }
    },

    async checkAuth({ state, commit }) {
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
        dispatch('clearTokens')
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

    async logout({ dispatch }) {
      await jwtAuth.logout()
      await dispatch('clearTokens')
      await router.push('/login')
    },

    async refreshAccessToken({ state, commit, dispatch }) {
      if (!state.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const newAccessToken = await jwtAuth.refresh(state.refreshToken)
        commit('SET_ACCESS_TOKEN', newAccessToken)
        jwtAuth.setAuthHeader(newAccessToken)
        return newAccessToken
      } catch (error) {
        await dispatch('clearTokens')
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
    }
  };
}
