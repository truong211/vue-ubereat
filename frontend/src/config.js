/**
 * Application Configuration
 * 
 * This file provides fallback values for environment variables
 * which helps prevent errors like "process is not defined"
 */

// Helper to safely get environment variables
const getEnvVar = (name, defaultValue) => {
  try {
    return import.meta.env[name] || defaultValue;
  } catch (e) {
    console.warn(`Failed to access environment variable ${name}, using default value`);
    return defaultValue;
  }
};

// Determine the current environment
const isProd = getEnvVar('VITE_NODE_ENV', '') === 'production';
const isDev = getEnvVar('VITE_NODE_ENV', 'development') === 'development';

// Base URLs with environment-specific defaults
const DEFAULT_BASE_URL = isDev ? 'http://localhost:3001' : window.location.origin;
const API_BASE = getEnvVar('VITE_API_BASE_URL', DEFAULT_BASE_URL);

// API and WebSocket URLs
export const API_URL = getEnvVar('VITE_API_URL', `${API_BASE}`);

// For WebSocket, use secure connection (wss) if on https, otherwise use ws
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// Remove trailing slash from base url if present
const baseUrl = API_BASE.replace(/\/$/, '');
// For local dev, default to localhost:3001, otherwise use current host with ws protocol
const defaultWsUrl = isDev ? 'ws://localhost:3001' : `${wsProtocol}//${window.location.host}`;
export const WS_URL = getEnvVar('VITE_WS_URL', defaultWsUrl);

// JWT version for token invalidation (change this when changing JWT secrets)
export const JWT_VERSION = '2023-04-21';

// Feature flags - default to disabled in production unless explicitly enabled
export const ENABLE_NOTIFICATIONS = getEnvVar('VITE_ENABLE_NOTIFICATIONS', isDev ? 'true' : 'false') !== 'false';
export const ENABLE_ANALYTICS = getEnvVar('VITE_ENABLE_ANALYTICS', 'true') !== 'false';
export const USE_MOCK_DATA = getEnvVar('VITE_USE_MOCK_DATA', isDev ? 'true' : 'false') === 'true';

// Application settings
export const APP_NAME = getEnvVar('VITE_APP_NAME', 'UberEat Clone');
export const DEFAULT_LANG = getEnvVar('VITE_DEFAULT_LANG', 'en');

// Storage keys with app environment prefix to prevent conflicts
const ENV_PREFIX = isProd ? 'prod_' : isDev ? 'dev_' : 'test_';
export const STORAGE_PREFIX = `ubereat_${ENV_PREFIX}`;
export const TOKEN_KEY = `${STORAGE_PREFIX}token`;
export const USER_KEY = `${STORAGE_PREFIX}user`;
export const CART_KEY = `${STORAGE_PREFIX}cart`;

// Debug settings
export const DEBUG_MODE = getEnvVar('VITE_DEBUG', isDev ? 'true' : 'false') === 'true';

// Websocket retry settings
export const WS_RETRY_COUNT = 3;
export const WS_RETRY_DELAY = 2000; // ms

// Helper function to clear all authentication-related data from storage
export const clearAuthStorage = () => {
  console.log('Clearing all authentication data from storage');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  // Also clear cookies by setting expiration in the past
  document.cookie = 'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'adminToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export default {
  API_URL,
  WS_URL,
  JWT_VERSION,
  ENABLE_NOTIFICATIONS,
  ENABLE_ANALYTICS,
  USE_MOCK_DATA,
  APP_NAME,
  DEFAULT_LANG,
  STORAGE_PREFIX,
  TOKEN_KEY,
  USER_KEY,
  CART_KEY,
  DEBUG_MODE,
  WS_RETRY_COUNT,
  WS_RETRY_DELAY,
  clearAuthStorage
};