import type { Module } from 'vuex'
import type { RootState, AuthState, User } from '../types'
import jwtAuth from '@/services/jwt-auth'
import router from '@/router'

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null
}

const auth: Module<AuthState, RootState> = {
  namespaced: true,

  state: initialState,

  mutations: {
    SET_TOKENS(state, { accessToken, refreshToken }) {
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      
      // Store tokens in localStorage
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
    },

    SET_ACCESS_TOKEN(state, token: string) {
      state.accessToken = token
      localStorage.setItem('accessToken', token)
    },

    CLEAR_TOKENS(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },

    SET_USER(state, user: User) {
      state.user = user
    }
  },

  actions: {
    async initialize({ state, dispatch }) {
      if (state.accessToken) {
        jwtAuth.setAuthHeader(state.accessToken)
        try {
          await dispatch('loadUser')
        } catch (error) {
          console.error('Failed to initialize auth state:', error)
        }
      }
    },

    async login({ commit, dispatch }, credentials) {
      try {
        const { accessToken, refreshToken } = await jwtAuth.login(credentials)
        
        commit('SET_TOKENS', { accessToken, refreshToken })
        jwtAuth.setAuthHeader(accessToken)
        
        await dispatch('loadUser')
        
        // Redirect to intended route or home
        const redirect = router.currentRoute.value.query.redirect as string
        await router.push(redirect || '/')
      } catch (error) {
        commit('CLEAR_TOKENS')
        throw error
      }
    },

    async register({ commit, dispatch }, registrationData) {
      try {
        const { accessToken, refreshToken } = await jwtAuth.register(registrationData)
        
        commit('SET_TOKENS', { accessToken, refreshToken })
        jwtAuth.setAuthHeader(accessToken)
        
        await dispatch('loadUser')
        await router.push('/')
      } catch (error) {
        commit('CLEAR_TOKENS')
        throw error
      }
    },

    async logout({ commit }) {
      try {
        // Clear tokens from localStorage and state
        commit('CLEAR_TOKENS')
        jwtAuth.setAuthHeader(null)
        await router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    },

    async loadUser({ commit, state }) {
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
      } catch (error) {
        console.error('Failed to load user:', error)
        throw error
      }
    },

    async refreshToken({ commit, state }) {
      if (!state.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const newAccessToken = await jwtAuth.refresh(state.refreshToken)
        commit('SET_ACCESS_TOKEN', newAccessToken)
        jwtAuth.setAuthHeader(newAccessToken)
        return newAccessToken
      } catch (error) {
        commit('CLEAR_TOKENS')
        throw error
      }
    },

    async socialLogin({ commit, dispatch }, { provider, token }) {
      try {
        const { accessToken, refreshToken } = await jwtAuth.socialLogin(provider, token)
        
        commit('SET_TOKENS', { accessToken, refreshToken })
        jwtAuth.setAuthHeader(accessToken)
        
        await dispatch('loadUser')
        await router.push('/')
      } catch (error) {
        commit('CLEAR_TOKENS')
        throw error
      }
    }
  },

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken,
    user: (state): User | null => state.user,
    userRole: (state): string | undefined => state.user?.role,
    hasRole: (state) => (role: string): boolean => state.user?.role === role,
    accessToken: (state): string | null => state.accessToken,
    refreshToken: (state): string | null => state.refreshToken
  }
}

export default auth