import { useAuthStore } from '@/stores/auth'

export const initializeAuth = async () => {
  try {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (accessToken && refreshToken) {
      const authStore = useAuthStore()
      
      // Set the tokens in the store
      authStore.SET_TOKENS({ accessToken, refreshToken })
      
      try {
        // Setup axios interceptors for token refresh
        await authStore.setupAxiosInterceptors()
        
        // Try to fetch user data with current token
        await authStore.fetchUser()
        console.log('Auth initialized successfully')
      } catch (error) {
        console.error('Failed to validate token:', error)
        // Clear auth state on failure
        await authStore.logout()
      }
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
  }
} 