import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import Toast from 'vue-toastification'
import { createI18n } from 'vue-i18n'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import 'vue-toastification/dist/index.css'
import './assets/styles/global.css'
import './assets/styles/navigation.css'

// Services
import { setupAxiosDefaults, setupAxiosInterceptors } from './services/axios-config'
import { initializeAuth } from './services/auth-service'
import { initNotifications } from './services/notification-service'

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages: {
    en: {
      // Add your English translations here
      message: {
        hello: 'Hello'
      }
    }
  }
})

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

// Toast configuration
const toastOptions = {
  transition: "Vue-Toastification__bounce",
  maxToasts: 3,
  newestOnTop: true,
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: "button",
  icon: true,
  rtl: false
}

// Create and configure app
const app = createApp(App)
const pinia = createPinia()

// Setup axios
setupAxiosDefaults()
setupAxiosInterceptors(router)

// Use plugins
app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(Toast, toastOptions)
app.use(i18n)

// Initialize app
const initApp = async () => {
  try {
    await initializeAuth()
    await initNotifications()
    app.mount('#app')
    console.log('App initialized successfully')
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.mount('#app') // Mount anyway to show error state
  }
}

initApp()
