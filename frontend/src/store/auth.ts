import { defineStore } from 'pinia'
import jwtAuth from '@/services/jwt-auth'
import router from '@/router'
import type { User } from './types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: null
  }),

  getters: {
    isAuthenticated(state: AuthState): boolean {
      return !!state.accessToken && !!state.user;
    },
    
    userRole(state: AuthState): string | undefined {
      return state.user?.role;
    }
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
      if (!this.accessToken) return;

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load user profile');
        }
        
        const user = await response.json();
        this.user = user;
      } catch (error) {
        console.error('Failed to load user:', error);
        this.clearTokens();
        throw error;
      }
    },

    setTokens({ accessToken, refreshToken }: AuthTokens) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      jwtAuth.setAuthHeader(accessToken);
    },

    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      jwtAuth.setAuthHeader(null);
    },

    async login(credentials: LoginCredentials) {
      try {
        const tokens = await jwtAuth.login(credentials)
        this.setTokens(tokens)
        await this.loadUser()
        
        const redirect = router.currentRoute.value.query.redirect as string
        await router.push(redirect || '/')
      } catch (error) {
        this.clearTokens()
        throw error
      }
    },

    async register(registrationData: any) {
      try {
        const tokens = await jwtAuth.register(registrationData)
        this.setTokens(tokens)
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

    async refreshAccessToken() {
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