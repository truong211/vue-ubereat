import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Axios for API requests
import axios from 'axios'

// VeeValidate for form validation
import { defineRule } from 'vee-validate'
import { required, email, min } from 'vee-validate/rules'

// Custom styles
import './style.css'

// Configure Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axios.interceptors.response.use(
  response => response,
  error => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      store.dispatch('logout')
      router.push('/auth/login')
    }
    return Promise.reject(error)
  }
)

// Initialize Vuetify
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#06C167',
          secondary: '#5C5C5C',
          accent: '#FF3F0F',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      },
      dark: {
        colors: {
          primary: '#06C167',
          secondary: '#BDBDBD',
          accent: '#FF6E4D',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  }
})

// Set up VeeValidate rules
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)

// Create app
const app = createApp(App)

// Use plugins
app.use(router)
app.use(store)
app.use(vuetify)

// Global error handler
app.config.errorHandler = (error, vm, info) => {
  console.error('Global error:', error)
  store.dispatch('setError', error.message || 'An unexpected error occurred')
}

// Initialize WebSocket connection after auth
store.dispatch('initWebSocket')

// Load user data if auth token exists
if (localStorage.getItem('token')) {
  store.dispatch('loadUser').catch(() => {
    // Token is invalid, redirect to login
    router.push('/auth/login')
  })
}

// Load cart data from localStorage
store.dispatch('loadCart')

// Mount app
app.mount('#app')