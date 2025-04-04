/**
 * API Endpoints Configuration
 * 
 * This file centralizes all API endpoint definitions for the application.
 * It makes it easier to maintain and update endpoints in one place.
 */

// Authentication endpoints
export const AUTH = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/resend-verification'
};

// User endpoints
export const USER = {
  PROFILE: '/api/user/profile',
  UPDATE_PROFILE: '/api/user/profile',
  CHANGE_PASSWORD: '/api/user/change-password',
  ADDRESSES: '/api/user/addresses',
  ADDRESS: (id) => `/api/user/addresses/${id}`,
  DEFAULT_ADDRESS: (id) => `/api/user/addresses/${id}/default`,
  PAYMENT_METHODS: '/api/user/payment-methods',
  PAYMENT_METHOD: (id) => `/api/user/payment-methods/${id}`,
  FAVORITES: '/api/user/favorites',
  FAVORITE: (id) => `/api/user/favorites/${id}`
};

// Restaurant endpoints
export const RESTAURANT = {
  ALL: '/api/restaurants',
  DETAILS: (id) => `/api/restaurants/${id}`,
  MENU: (id) => `/api/restaurants/${id}/menu`,
  REVIEWS: (id) => `/api/restaurants/${id}/reviews`,
  NEARBY: '/api/restaurants/nearby',
  FEATURED: '/api/restaurants/featured',
  POPULAR: '/api/restaurants/popular',
  NEW: '/api/restaurants/new',
  SEARCH: '/api/restaurants/search'
};

// Cart endpoints
export const CART = {
  GET: '/api/cart',
  ADD: '/api/cart',
  UPDATE: (id) => `/api/cart/${id}`,
  REMOVE: (id) => `/api/cart/${id}`,
  CLEAR: '/api/cart',
  VALIDATE: '/api/cart/validate'
};

// Order endpoints
export const ORDER = {
  ALL: '/api/orders',
  DETAILS: (id) => `/api/orders/${id}`,
  CREATE: '/api/orders',
  CANCEL: (id) => `/api/orders/${id}/cancel`,
  STATUS: (id) => `/api/orders/${id}/status`,
  UPDATES: (id) => `/api/orders/${id}/updates`,
  TRACK: (id) => `/api/orders/${id}/track`,
  REORDER: (id) => `/api/orders/${id}/reorder`,
  REVIEW: (id) => `/api/orders/${id}/review`
};

// Checkout endpoints
export const CHECKOUT = {
  INIT: '/api/checkout/init',
  PROCESS: '/api/checkout/process',
  VALIDATE: '/api/checkout/validate',
  COMPLETE: '/api/checkout/complete'
};

// Payment endpoints
export const PAYMENT = {
  METHODS: '/api/payment/methods',
  PROCESS: '/api/payment/process',
  VERIFY: '/api/payment/verify',
  CANCEL: '/api/payment/cancel'
};

// Review endpoints
export const REVIEW = {
  CREATE: '/api/reviews',
  UPDATE: (id) => `/api/reviews/${id}`,
  DELETE: (id) => `/api/reviews/${id}`,
  VOTE: (id) => `/api/reviews/${id}/vote`
};

// Promotion endpoints
export const PROMOTION = {
  ALL: '/api/promotions',
  DETAILS: (id) => `/api/promotions/${id}`,
  APPLY: '/api/promotions/apply',
  VALIDATE: (code) => `/api/promotions/validate/${code}`
};

// Category endpoints
export const CATEGORY = {
  ALL: '/api/categories',
  DETAILS: (id) => `/api/categories/${id}`
};

// Product endpoints
export const PRODUCT = {
  ALL: '/api/products',
  DETAILS: (id) => `/api/products/${id}`,
  POPULAR: '/api/products/popular',
  RECOMMENDED: '/api/products/recommended',
  SEARCH: '/api/products/search'
}; 