import axios from 'axios'

export const setupAxiosDefaults = () => {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  axios.defaults.withCredentials = true
  axios.defaults.headers.common['Accept'] = 'application/json'
  axios.defaults.headers.post['Content-Type'] = 'application/json'
  axios.defaults.timeout = 10000
}

export const setupAxiosInterceptors = (router) => {
  // Request interceptor
  axios.interceptors.request.use(config => {
    config.withCredentials = true
    
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    } else {
      delete config.headers['Authorization']
    }

    if (import.meta.env.DEV) {
      console.log(`${config.method?.toUpperCase()} ${config.url}`)
    }

    return config
  }, error => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  })

  // Response interceptor
  axios.interceptors.response.use(
    response => response,
    async error => {
      if (!error.response) {
        return Promise.reject(error)
      }

      const errorMessage = error.response.data?.message?.toLowerCase() || ''

      if (error.response.status === 401) {
        const isAuthEndpoint = error.config.url.includes('/auth/')
        if (!isAuthEndpoint) {
          try {
            const { useAuthStore } = await import('@/stores/auth')
            const authStore = useAuthStore()
            
            if (errorMessage.includes('expired')) {
              try {
                await authStore.refreshToken()
                return axios(error.config)
              } catch (refreshError) {
                await authStore.logout()
                router.push('/login')
                return Promise.reject(refreshError)
              }
            } else {
              await authStore.logout()
              router.push('/login')
            }
          } catch (e) {
            console.error('Error handling auth error:', e)
          }
        }
      }

      if (import.meta.env.DEV) {
        console.error(`API Error: ${error.response.status} - ${error.message}`)
        console.error('Response data:', error.response.data)
      }

      return Promise.reject(error)
    }
  )
} 