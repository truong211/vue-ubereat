import { createApp } from 'vue'
import App from './App.vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import router from './router'
import store from './store'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import socialAuth from './services/social-auth'
import jwtAuth from './services/jwt-auth.js'
import i18n from './i18n'
import './assets/styles/global.css'
import { pushNotificationService } from '@/services/push-notification.service'
import axios from 'axios'
import { clearAuthStorage } from './config'

// Import Firebase config only if Firebase is enabled
if (import.meta.env.VITE_USE_FIREBASE === 'true') {
  import('./config/firebase')
    .then(() => console.log('Firebase initialized successfully'))
    .catch(error => console.warn('Failed to initialize Firebase:', error));
}

// Set axios default base URL to point to the backend server
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Add interceptor to log requests for debugging
axios.interceptors.request.use(config => {
  console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
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

// Initialize JWT auth service
jwtAuth.init()

// Setup JWT auth interceptors
jwtAuth.setupInterceptors(
  // Get refresh token
  () => store.state.auth.refreshToken || localStorage.getItem('refresh_token'),
  // On refresh success
  (token) => {
    store.commit('auth/SET_TOKENS', { 
      accessToken: token, 
      refreshToken: localStorage.getItem('refresh_token')
    })
    jwtAuth.setAuthHeader(token)
  },
  // On refresh error
  () => {
    store.dispatch('auth/logout')
  }
)

// Set initial auth header if token exists
const token = localStorage.getItem('token')
if (token) {
  jwtAuth.setAuthHeader(token)
}

// Initialize social auth SDKs
const initSocialAuth = async () => {
  try {
    await socialAuth.initSocialAuth();
    console.log('Social auth initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize social auth:', error);
  }
};

// Initialize push notifications
const initNotificationSystem = async () => {
  try {
    // Initialize notification system in the store
    await store.dispatch('notifications/initNotifications');
    
    // Initialize push notification service if user is logged in
    if (store.state.auth.user) {
      await store.dispatch('notifications/initPushNotifications');
    }
    
    // Listen for auth state changes to init/cleanup notifications
    store.watch(
      (state) => state.auth.user,
      (newUser) => {
        if (newUser) {
          store.dispatch('notifications/initPushNotifications');
        }
      }
    );
    
    console.log('Notification system initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize notification system:', error);
  }
};

// Create and mount app
const app = createApp(App)

// Provide the store instance to all components
app.provide('store', store)

app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: 'button',
  icon: true,
  rtl: false
})

app.use(store)
app.use(router)
app.use(vuetify)
app.use(i18n)

// Initialize WebSocket service (only for authenticated users)
if (store.state.auth?.user) {
  store.dispatch('initWebSocket');
  
  // Only initialize admin WebSocket for admin users
  if (store.state.auth.user.role === 'admin') {
    console.log('Initializing admin WebSocket connection for admin user');
    
    // Wrap the WebSocket initialization in a try/catch to prevent fatal errors
    try {
      store.dispatch('admin/initWebSocket');
    } catch (error) {
      console.warn('Failed to initialize admin WebSocket:', error);
      // Continue app execution even if admin WebSocket fails
    }
  } else {
    console.log('Skipping admin WebSocket initialization - not an admin user');
  }
} else {
  console.log('Skipping WebSocket initialization - user not authenticated');
}

// Mount the app
app.mount('#app')

// Initialize services after app is mounted
initSocialAuth()
initNotificationSystem()
