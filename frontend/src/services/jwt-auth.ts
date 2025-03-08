/// <reference types="vite/client" />

import axios from 'axios'
import type { User } from '../store/types'

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface TokenResponse {
  accessToken: string;
}

class JWTAuthService {
  private baseURL: string
  private refreshPromise: Promise<TokenResponse> | null = null

  constructor() {
    this.baseURL = `${import.meta.env.VITE_API_URL}/auth`
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.baseURL}/login`,
      credentials
    )
    return response.data
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.baseURL}/register`,
      data
    )
    return response.data
  }

  async socialLogin(provider: string, token: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.baseURL}/social/${provider}`,
      { token }
    )
    return response.data
  }

  async refresh(refreshToken: string): Promise<string> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      const result = await this.refreshPromise
      return result.accessToken
    }

    // Start new refresh request
    this.refreshPromise = axios
      .post<TokenResponse>(`${this.baseURL}/refresh`, { refreshToken })
      .then(response => response.data)
      .finally(() => {
        this.refreshPromise = null
      })

    const result = await this.refreshPromise
    return result.accessToken
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/logout`, { refreshToken })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  setAuthHeader(token: string | null): void {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiry = payload.exp * 1000 // Convert to milliseconds
      return Date.now() >= expiry
    } catch (e) {
      return true
    }
  }

  // Setup axios interceptor for automatic token refresh
  setupInterceptors(
    getRefreshToken: () => string | null,
    onRefreshSuccess: (token: string) => void,
    onRefreshError: () => void
  ): void {
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config

        // If the error is not 401 or the request was for refresh, reject
        if (
          error.response?.status !== 401 ||
          originalRequest.url === `${this.baseURL}/refresh` ||
          originalRequest._retry
        ) {
          return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
          const refreshToken = getRefreshToken()
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const newAccessToken = await this.refresh(refreshToken)
          onRefreshSuccess(newAccessToken)
          this.setAuthHeader(newAccessToken)
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          
          return axios(originalRequest)
        } catch (refreshError) {
          onRefreshError()
          return Promise.reject(refreshError)
        }
      }
    )
  }
}

export default new JWTAuthService()