// Configuration file for the application

// API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Other configuration constants can be added here
export const APP_NAME = 'UberEat Clone'
export const DEFAULT_LANGUAGE = 'en'

// Social auth configuration
export const SOCIAL_AUTH = {
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID
}

// Payment configuration
export const PAYMENT = {
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY
}