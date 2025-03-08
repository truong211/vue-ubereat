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
import jwtAuth from './services/jwt-auth'
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
socialAuth.initSocialAuth().catch(error => {
  console.warn('Failed to initialize social auth:', error)
  // Non-blocking error - social login will attempt re-init when used
})

// Create and mount app
const app = createApp(App)

app.use(Toast, {
  // ... existing plugin options
})

app.use(store)
app.use(router)
app.use(vuetify)
app.use(i18n)
app.mount('#app')
