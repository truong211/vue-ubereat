/**
 * Application configuration
 */

// Import environment variables from .env
require('dotenv').config();

// Get JWT secrets from environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret-key-for-development-only';

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'ubereat',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_key',
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'test@example.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    from: process.env.EMAIL_FROM || 'no-reply@ubereat.com',
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    apiKey: process.env.CLOUDINARY_API_KEY || 'demo',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'demo',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'mock-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  },
  
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || 'mock-app-id',
    appSecret: process.env.FACEBOOK_APP_SECRET || 'mock-app-secret',
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback',
  },
  
  paymentConfig: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE || 'mock-tmn-code',
      hashSecret: process.env.VNPAY_HASH_SECRET || 'mock-hash-secret',
      apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE || 'mock-partner-code',
      accessKey: process.env.MOMO_ACCESS_KEY || 'mock-access-key',
      secretKey: process.env.MOMO_SECRET_KEY || 'mock-secret-key',
      apiUrl: process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create',
      notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/api/payments/notify/momo'
    },
    zalopay: {
      appId: process.env.ZALOPAY_APP_ID || 'mock-app-id',
      key1: process.env.ZALOPAY_KEY1 || 'mock-key1',
      key2: process.env.ZALOPAY_KEY2 || 'mock-key2',
      apiUrl: process.env.ZALOPAY_API_URL || 'https://sandbox.zalopay.com.vn/v001/tpe/createorder'
    }
  }
};

module.exports = config; 