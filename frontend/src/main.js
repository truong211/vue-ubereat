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

// Setup JWT auth interceptors
jwtAuth.setupInterceptors(
  // Get refresh token
  () => store.state.auth.refreshToken,
  // On refresh success
  (token) => {
    store.commit('auth/SET_TOKENS', { 
      accessToken: token, 
      refreshToken: store.state.auth.refreshToken 
    })
    jwtAuth.setAuthHeader(token)
  },
  // On refresh error
  () => {
    store.commit('auth/CLEAR_AUTH')
    router.push('/auth/login')
  }
)

// Set initial auth header if token exists
const token = store.state.auth.accessToken
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

// Create and mount app
const app = createApp(App)

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

// Initialize social auth after app is mounted
app.mount('#app')
initSocialAuth()
