import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import socialAuth from './services/social-auth'
import JwtAuth from './services/jwt-auth.js'
import i18n from './i18n'
import './assets/styles/global.css'
import './assets/styles/navigation.css'
import { pushNotificationService } from '@/services/push-notification.service'
import axios from 'axios'
import { clearAuthStorage } from './config'
import { jwtDecode } from 'jwt-decode'

// Import Firebase config only if Firebase is enabled
if (import.meta.env.VITE_USE_FIREBASE === 'true') {
  import('./config/firebase')
    .then(() => console.log('Firebase initialized successfully'))
    .catch(error => console.warn('Failed to initialize Firebase:', error));
}

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
axios.defaults.withCredentials = true
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.timeout = 10000 // 10 second timeout

// Add interceptor to log requests for debugging and add auth token
axios.interceptors.request.use(config => {
  // Ensure withCredentials is always true
  config.withCredentials = true;
  
  // Log the full request details
  console.log('Full request config:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    headers: config.headers,
    data: config.data,
    withCredentials: config.withCredentials
  });

  // Add Authorization header with JWT token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log('Added Authorization header with token');
  } else {
    console.log('No token found in localStorage');
    delete config.headers['Authorization'];
  }

  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log(`Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    console.error(`API Error: ${error.response?.status || 'Network Error'} - ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);

      // Handle 401 errors specifically
      if (error.response.status === 401) {
        // Check if the error is related to invalid token
        const errorMessage = error.response.data.message?.toLowerCase() || '';
        console.log('Auth error details:', errorMessage);

        if (errorMessage.includes('invalid token') ||
            errorMessage.includes('invalid signature') ||
            errorMessage.includes('expired') ||
            errorMessage.includes('authentication failed') ||
            errorMessage.includes('not logged in')) {
          console.warn('Authentication token issue detected, redirecting to token clear page');
          console.warn('This is likely due to a change in the server JWT secret key');

          // Clear all authentication data
          clearAuthStorage();

          // Redirect to the clear-tokens page which will handle the reset flow
          if (window.location.pathname !== '/clear-tokens' &&
              window.location.pathname !== '/login') {
            window.location.href = '/clear-tokens';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#ff5252',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  }
})

// Create Pinia instance
const pinia = createPinia()

// Create app instance
const app = createApp(App)

// Use plugins
app.use(pinia) // Initialize Pinia first
app.use(router)
app.use(vuetify)
app.use(i18n)
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 3,
  newestOnTop: true
})

// Initialize auth headers and store user data
const initializeAuth = async () => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      try {
        await authStore.fetchUser()
        console.log('Auth initialized successfully')
      } catch (error) {
        console.error('Failed to validate token:', error)
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
      }
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
  }
}

// Initialize notification system
const initNotificationSystem = async () => {
  try {
    const { useNotificationStore } = await import('@/stores/notifications')
    const notificationStore = useNotificationStore()
    await notificationStore.initNotifications()
    console.log('Notification system initialized successfully')
  } catch (error) {
    console.warn('Failed to initialize notification system:', error)
  }
}

// Initialize the app
const initApp = async () => {
  try {
    // Initialize auth
    await initializeAuth()
    
    // Mount the app
    app.mount('#app')

    // Initialize notifications if enabled
    if (import.meta.env.VITE_USE_NOTIFICATIONS === 'true') {
      await initNotificationSystem()
    }

  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

// Start the application
initApp()
