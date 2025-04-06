/**
 * API Endpoints Configuration
 *
 * This file centralizes all API endpoint definitions for the application.
 * It makes it easier to maintain and update endpoints in one place.
 */

// Authentication endpoints
export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification'
};

// User endpoints
export const USER = {
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/change-password',
  ADDRESSES: '/user/addresses',
  ADDRESS: (id) => `/user/addresses/${id}`,
  DEFAULT_ADDRESS: (id) => `/user/addresses/${id}/default`,
  PAYMENT_METHODS: '/user/payment-methods',
  PAYMENT_METHOD: (id) => `/user/payment-methods/${id}`,
  FAVORITES: '/user/favorites',
  FAVORITE: (id) => `/user/favorites/${id}`
};

// Restaurant endpoints
export const RESTAURANT = {
  ALL: '/restaurants',
  DETAILS: (id) => `/restaurants/${id}`,
  MENU: (id) => `/restaurants/${id}/menu`,
  REVIEWS: (id) => `/restaurants/${id}/reviews`,
  NEARBY: '/restaurants/nearby',
  FEATURED: '/restaurants/featured',
  POPULAR: '/restaurants/popular',
  NEW: '/restaurants/new',
  SEARCH: '/restaurants/search'
};

// Cart endpoints
export const CART = {
  GET: '/cart',
  ADD: '/cart',
  UPDATE: (id) => `/cart/${id}`,
  REMOVE: (id) => `/cart/${id}`,
  CLEAR: '/cart',
  VALIDATE: '/cart/validate'
};

// Order endpoints
export const ORDER = {
  ALL: '/orders',
  DETAILS: (id) => `/orders/${id}`,
  CREATE: '/orders',
  CANCEL: (id) => `/orders/${id}/cancel`,
  STATUS: (id) => `/orders/${id}/status`,
  UPDATES: (id) => `/orders/${id}/updates`,
  TRACK: (id) => `/orders/${id}/track`,
  REORDER: (id) => `/orders/${id}/reorder`,
  REVIEW: (id) => `/orders/${id}/review`
};

// Checkout endpoints
export const CHECKOUT = {
  INIT: '/checkout/init',
  PROCESS: '/checkout/process',
  VALIDATE: '/checkout/validate',
  COMPLETE: '/checkout/complete'
};

// Payment endpoints
export const PAYMENT = {
  METHODS: '/payment/methods',
  PROCESS: '/payment/process',
  VERIFY: '/payment/verify',
  CANCEL: '/payment/cancel'
};

// Review endpoints
export const REVIEW = {
  CREATE: '/reviews',
  UPDATE: (id) => `/reviews/${id}`,
  DELETE: (id) => `/reviews/${id}`,
  VOTE: (id) => `/reviews/${id}/vote`
};

// Promotion endpoints
export const PROMOTION = {
  ALL: '/promotions',
  DETAILS: (id) => `/promotions/${id}`,
  APPLY: '/promotions/apply',
  VALIDATE: (code) => `/promotions/validate/${code}`
};

// Category endpoints
export const CATEGORY = {
  ALL: '/categories',
  DETAILS: (id) => `/categories/${id}`
};

// Product endpoints
export const PRODUCT = {
  ALL: '/products',
  DETAILS: (id) => `/products/${id}`,
  POPULAR: '/products/popular',
  RECOMMENDED: '/products/recommended',
  SEARCH: '/products/search'
};