import { createApp } from 'vue'
import { createPinia } from 'pinia' // Import Pinia
import App from '@/App.vue'
import router from '@/router'
// import store from '@/store' // Removed Vuex store
import { useAuthStore } from '@/store/auth' // Import Pinia auth store
import JwtAuth from '@/services/jwt-auth.js' // Import the JwtAuth service
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
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
axios.defaults.timeout = 10000 // 10 second timeout

// Initialize JWT auth service
const jwtAuth = new JwtAuth();

// Initialize auth service and set up the interceptors internally
jwtAuth.init();

// Initialize authentication state
const initializeAuth = async (piniaInstance) => {
  const authStore = useAuthStore(piniaInstance);
  const token = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  // Only attempt auto-login if both tokens are present
  if (token && refreshToken) {
    console.log('[Auth] Found tokens in localStorage, attempting to initialize auth state...');
    try {
      // Set tokens in Pinia store. Axios interceptors (setup in jwtAuth.init) should use these.
      authStore.setTokens({ accessToken: token, refreshToken });

      // Attempt to load user data using the stored tokens via Pinia action.
      await authStore.loadUser();
      console.log('[Auth] User data loaded successfully via Pinia.');

    } catch (error) {
      console.warn('[Auth] Failed to initialize auth state or load user data:', error);
      // Clear tokens if initialization or user load fails to prevent inconsistent state
      authStore.clearTokens();
    }
  } else {
    console.log('[Auth] No valid token pair found in localStorage. Skipping auto-login.');
    // Ensure state is clear if no tokens are found
    if (authStore.isAuthenticated || authStore.accessToken || authStore.refreshToken) {
        console.log('[Auth] Clearing potentially stale auth state.');
        authStore.clearTokens();
    }
  }
};

// Create Pinia instance
const pinia = createPinia()

// Run initialization (pass pinia instance)
// Note: This needs to run *after* pinia is used by the app
// We will call this after app.use(pinia)

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
// app.use(store) // Removed Vuex store usage
app.use(pinia) // Use Pinia
app.use(vuetify)

// Initialize Pinia-based auth *after* Pinia is installed
initializeAuth(pinia);

// Global error handler
// TODO: Replace with Pinia-based error handling
// app.config.errorHandler = (error, vm, info) => {
//   console.error('Global error:', error)
//   // const errorStore = useErrorStore(pinia); // Example
//   // errorStore.setError(error.message || 'An unexpected error occurred');
// }

// Initialize WebSocket connection after auth
// TODO: Replace with Pinia-based WebSocket initialization
// store.dispatch('initWebSocket')
// const websocketStore = useWebSocketStore(pinia); // Example
// websocketStore.initWebSocket();

// Removed redundant Vuex-based user loading. initializeAuth handles this with Pinia.

// Load cart data from localStorage
// TODO: Replace with Pinia-based cart loading
// store.dispatch('loadCart')
// const cartStore = useCartStore(pinia); // Example
// cartStore.loadCart();

// Mount app
app.mount('#app')