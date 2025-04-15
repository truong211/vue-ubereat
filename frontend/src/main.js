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
import './assets/styles/navigation.css'
import { pushNotificationService } from '@/services/push-notification.service'
import axios from 'axios'
import { clearAuthStorage } from './config'

// Import Firebase config only if Firebase is enabled
if (import.meta.env.VITE_USE_FIREBASE === 'true') {
  import('./config/firebase')
    .then(() => console.log('Firebase initialized successfully'))
    .catch(error => console.warn('Failed to initialize Firebase:', error));
}

// Configure axios for API requests
axios.defaults.baseURL = '/api' // Use Vite proxy
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Add request interceptor to normalize URLs and log requests
axios.interceptors.request.use(config => {
  // Normalize URL to prevent duplicate /api prefixes
  if (config.url.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  
  // Log the request
  console.log(`[Axios Request] ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log(`[Axios Response] ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    console.error(`[Axios Error] ${error.response?.status || 'Network Error'} - ${error.message}`);
    if (error.response) {
      console.error('[Axios Error Response]:', error.response.data);
      
      // Handle 401 errors specifically
      if (error.response.status === 401) {
        // Check if the error is related to invalid token
        const errorMessage = error.response.data.message?.toLowerCase() || '';
        console.log('[Axios Auth Error]:', errorMessage);
        
        if (errorMessage.includes('invalid token') || 
            errorMessage.includes('invalid signature') || 
            errorMessage.includes('expired') ||
            errorMessage.includes('authentication failed') ||
            errorMessage.includes('not logged in')) {
          console.warn('Authentication token issue detected, redirecting to token clear page');
          
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

// Configure plugins
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

// Initialize store first
app.use(store)

// Then other plugins
app.use(router)
app.use(vuetify)
app.use(i18n)

// Initialize WebSocket service (only for authenticated users)
if (store.state.auth?.user) {
  store.dispatch('initWebSocket');
  
  // Only initialize admin WebSocket for admin users
  if (store.state.auth.user.role === 'admin') {
    console.log('Initializing admin WebSocket connection for admin user');
    try {
      store.dispatch('admin/initWebSocket');
    } catch (error) {
      console.warn('Failed to initialize admin WebSocket:', error);
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
