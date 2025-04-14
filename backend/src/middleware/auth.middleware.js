const jwt = require('jsonwebtoken');
const { getDb } = require('../models');
const db = require('../config/database');
const TokenBlacklist = require('../models/token-blacklist');

let models = null;
const initializeModels = async () => {
  if (!models) {
    models = await getDb();
  }
  return models;
};

// Get JWT secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('JWT secrets not configured. Please set JWT_SECRET and JWT_REFRESH_SECRET environment variables.');
  process.exit(1);
}

// Debug JWT secret (first 10 chars)
console.log(`Using JWT_SECRET starting with: ${JWT_SECRET.substring(0, 10)}...`);

// Add a timestamp for when the JWT secret was last updated
const JWT_ISSUED_AFTER = 0;

// Error handler class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to verify JWT with detailed error logging and blacklist check
const verifyToken = async (token) => {
  try {
    if (!token) {
      console.log('No token provided for verification');
      return null;
    }

    const models = await initializeModels();
    // Check if token is blacklisted
    const isBlacklisted = await models.TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      console.log('Token is blacklisted');
      return null;
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully');
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt
    });
    return null;
  }
};

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/refresh',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/restaurants/nearby',
  '/api/restaurants',
  '/api/restaurants/featured',
  '/api/products',
  '/api/categories',
  '/api/pages',
  '/api/banners',
  '/api/faqs',
  '/api/static-pages',
  '/api/health',
  '/admin/login'
];

// Define semi-protected routes that should return empty data instead of 401
const SEMI_PROTECTED_ROUTES = [
  '/api/notifications',
  '/api/notifications/preferences',
  '/api/favorites',
  '/api/favorites/foods',
  '/api/favorites/restaurants',
  '/api/cart',
  '/api/user/preferences',
  '/api/user/settings'
];

// Define admin routes that should redirect to login instead of showing 401
const ADMIN_ROUTES = [
  '/admin',
  '/admin/',
  '/admin/dashboard',
  '/admin/restaurants',
  '/admin/users',
  '/admin/orders',
  '/admin/settings',
  '/admin/banners',
  '/admin/pages',
  '/admin/config'
];

// Helper function to check if a route is public
const isPublicRoute = (path) => {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/socket.io' || route === '/ws') {
      return path.startsWith(route);
    }
    if (route.startsWith('/admin/table')) {
      return path.startsWith(route);
    }
    return path.startsWith(route) || path === route;
  });
};

// Helper function to check if a route is semi-protected
const isSemiProtectedRoute = (path) => {
  return SEMI_PROTECTED_ROUTES.some(route => path.startsWith(route) || path === route);
};

// Helper function to check if a route is an admin route
const isAdminRoute = (path) => {
  return ADMIN_ROUTES.some(route => path.startsWith(route) || path === route) ||
         path.startsWith('/admin/');
};

const authMiddleware = async (req, res, next) => {
  try {
    console.log(`Auth request: ${req.method} ${req.path}`);

    if (req.method === 'OPTIONS') {
      return next();
    }

    if (isPublicRoute(req.path)) {
      return next();
    }

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded || (!decoded.id && !decoded.userId)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.'
        });
      }

      const userId = decoded.id || decoded.userId;
      const models = await initializeModels();
      const user = await models.User.findByPk(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please log in again.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please log in again.'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const optionalToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next();
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return next();
    }

    if (JWT_ISSUED_AFTER > 0 && decoded.iat && decoded.iat < JWT_ISSUED_AFTER) {
      console.log('Token was issued before the last secret update. Proceeding as guest...');
      return next();
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    next();
  }
};

// Middleware to verify access token
const verifyAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check token issue date
    if (decoded.iat < JWT_ISSUED_AFTER) {
      throw new AppError('Token was issued before the last security update', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError(error.message || 'Authentication failed', error.statusCode || 401));
  }
};

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken;
    if (!token) {
      throw new AppError('No refresh token provided', 401);
    }

    const models = await initializeModels();
    const isBlacklisted = await models.TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    next(new AppError(error.message || 'Refresh token verification failed', error.statusCode || 401));
  }
};

// Middleware to blacklist token
const blacklistToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided for blacklisting', 400);
    }

    const models = await initializeModels();
    await models.TokenBlacklist.addToBlacklist(token);
    next();
  } catch (error) {
    next(new AppError(error.message || 'Failed to blacklist token', error.statusCode || 500));
  }
};

// Export middleware functions
module.exports = {
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  AppError,
  authMiddleware,
  optionalToken,
  isAdmin: (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error',
        message: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  },
  isRestaurant: (req, res, next) => {
    if (!req.user || req.user.role !== 'restaurant') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Restaurant privileges required.'
      });
    }
    next();
  },
  isDriver: (req, res, next) => {
    if (!req.user || req.user.role !== 'driver') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Driver privileges required.'
      });
    }
    next();
  },
  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to perform this action'
        });
      }
      next();
    };
  }
};