import { defineStore } from 'pinia'
import jwtAuth from '@/services/jwt-auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userRole: (state) => state.user?.role,
    hasRole: (state) => (role) => state.user?.role === role
  },

  actions: {
    async initialize() {
      if (this.accessToken) {
        jwtAuth.setAuthHeader(this.accessToken)
        try {
          await this.loadUser()
        } catch (error) {
          console.error('Failed to initialize auth state:', error)
          this.clearTokens()
        }
      }
    },

    async loadUser() {
      if (!this.accessToken) return

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load user profile')
        }
        
        const user = await response.json()
        this.user = user
      } catch (error) {
        console.error('Failed to load user:', error)
        throw error
      }
    },

    setTokens({ accessToken, refreshToken }) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      
      jwtAuth.setAuthHeader(accessToken)
    },

    clearTokens() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      jwtAuth.setAuthHeader(null)
    },

    async login(credentials) {
      try {
        const { accessToken, refreshToken } = await jwtAuth.login(credentials)
        this.setTokens({ accessToken, refreshToken })
        await this.loadUser()
        
        const redirect = router.currentRoute.value.query.redirect
        await router.push(redirect || '/')
      } catch (error) {
        this.clearTokens()
        throw error
      }
    },

    async register(registrationData) {
      try {
        const { accessToken, refreshToken } = await jwtAuth.register(registrationData)
        this.setTokens({ accessToken, refreshToken })
        await this.loadUser()
        await router.push('/')
      } catch (error) {
        this.clearTokens()
        throw error
      }
    },

    async logout() {
      this.clearTokens()
      await router.push('/login')
    },

    async refreshToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const newAccessToken = await jwtAuth.refresh(this.refreshToken)
        this.accessToken = newAccessToken
        localStorage.setItem('accessToken', newAccessToken)
        jwtAuth.setAuthHeader(newAccessToken)
        return newAccessToken
      } catch (error) {
        this.clearTokens()
        throw error
      }
    }
  }
})