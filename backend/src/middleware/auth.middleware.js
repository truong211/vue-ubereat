const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Get JWT secrets from environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret-key-for-development-only';

// Debug JWT secret (first 10 chars)
console.log(`Using JWT_SECRET starting with: ${JWT_SECRET.substring(0, 10)}...`);

// Add a timestamp for when the JWT secret was last updated
// Any tokens issued before this time will be rejected
// DISABLED to fix login issues - set to 0 (Jan 1, 1970)
const JWT_ISSUED_AFTER = 0; // Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60); // 7 days ago

// Error handler class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to verify JWT with detailed error logging
const verifyToken = (token) => {
  try {
    if (!token) {
      console.log('No token provided for verification');
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
  '/api/restaurants/nearby',
  '/api/recommendations',
  '/api/pages',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/categories',
  '/api/products',
  '/api/restaurants',
  '/api/search',
  '/api/banners',
  '/api/faqs',
  '/api/static-pages',
  '/api/config',
  '/socket.io', // Add WebSocket endpoint as public
  '/ws',  // Add alternative WebSocket endpoint
  '/admin/login', // Add admin login page
  '/admin/tables', // Add admin tables endpoint for debugging
  '/admin/table-structure', // Add admin table structure endpoint
  '/admin/table-records', // Add admin table records endpoint
  '/admin/check-auth' // Add admin auth check endpoint
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
    // Special handling for WebSocket endpoints
    if (route === '/socket.io' || route === '/ws') {
      return path.startsWith(route);
    }
    // Special handling for admin table endpoints
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

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Detailed request logging 
    console.log(`Auth request: ${req.method} ${req.path} | Auth: ${req.isAuthenticated ? (req.isAuthenticated() ? 'Yes' : 'No') : 'No method'} | Has JWT Cookie: ${req.cookies && req.cookies.jwt ? 'Yes' : 'No'}`);
    
    // CORS OPTIONS handling - always allow OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Check if it's a public route first - allow immediately
    if (isPublicRoute(req.path)) {
      return next();
    }

    // For semi-protected routes with GET method
    if (isSemiProtectedRoute(req.path) && req.method === 'GET') {
      // First check if user is actually authenticated before returning empty data
      let isAuth = false;
      
      // Check session auth first
      if (req.isAuthenticated && req.isAuthenticated()) {
        isAuth = true;
      } else {
        // Then check JWT token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
          token = req.cookies.jwt;
        }
        
        if (token) {
          const decoded = verifyToken(token);
          if (decoded && (decoded.id || decoded.userId)) {
            isAuth = true;
            // Try to set the user if possible for other middleware
            try {
              const userId = decoded.id || decoded.userId;
              const user = await User.findByPk(userId);
              if (user) {
                req.user = user;
                res.locals.user = user;
              }
            } catch (err) {
              console.error('Error fetching user for semi-protected route:', err);
            }
          }
        }
      }
      
      // If authenticated, proceed normally, otherwise return empty data
      if (isAuth) {
        return next();
      }
      
      if (req.path.includes('notifications')) {
        return res.json({ notifications: [], unreadCount: 0 });
      }
      if (req.path.includes('favorites')) {
        return res.json({ items: [] });
      }
      if (req.path.includes('cart')) {
        return res.json({ items: [], total: 0 });
      }
      if (req.path.includes('preferences') || req.path.includes('settings')) {
        return res.json({ preferences: {}, settings: {} });
      }
      return res.json({ data: [] });
    }

    // For admin routes, handle authentication and redirect if needed
    if (isAdminRoute(req.path) && req.method === 'GET') {
      console.log('Handling admin route access for:', req.path);
      
      // Check if user is already authenticated via Passport session
      if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.role === 'admin') {
        console.log('User authenticated via session:', req.user.id);
        return next();
      }

      // Get token from Authorization header or cookies
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
      }

      console.log('Admin auth token found:', token ? 'Yes' : 'No');
      
      // If no token, redirect to admin login
      if (!token) {
        // For API requests, return 401
        if (req.path.startsWith('/api/')) {
          return next(new AppError('You are not logged in. Please log in to get access', 401));
        }
        
        // For direct admin page requests, redirect to login
        return res.redirect('/admin/login');
      }

      // Use our helper function to verify the token
      const decoded = verifyToken(token);
      console.log('Admin token verified:', decoded ? 'Yes' : 'No');
      
      // If token verification failed, redirect to login
      if (!decoded) {
        if (req.path.startsWith('/api/')) {
          return next(new AppError('Invalid token. Please log in again', 401));
        }
        return res.redirect('/admin/login');
      }

      // Check if user id exists in decoded token
      if (!decoded.id && !decoded.userId) {
        if (req.path.startsWith('/api/')) {
          return next(new AppError('Invalid token. Please log in again', 401));
        }
        return res.redirect('/admin/login');
      }

      // Set userId from either id or userId property
      const userId = decoded.id || decoded.userId;
      console.log('Admin user ID from token:', userId);
      
      // Check if user still exists and is an admin
      const user = await User.findByPk(userId);
      if (!user) {
        console.log('Admin user not found in database');
        if (req.path.startsWith('/api/')) {
          return next(new AppError('The user belonging to this token no longer exists', 401));
        }
        return res.redirect('/admin/login');
      }
      
      if (user.role !== 'admin') {
        console.log('User does not have admin role:', user.role);
        if (req.path.startsWith('/api/')) {
          return next(new AppError('Access denied. Admin privileges required.', 403));
        }
        return res.redirect('/admin/login');
      }

      // GRANT ACCESS TO ADMIN ROUTE
      console.log('Admin access granted for user:', user.id);
      req.user = user;
      res.locals.user = user;
      
      // Refresh the cookie to extend session
      const newToken = jwt.sign(
        { id: user.id, userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.cookie('jwt', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/' // Ensure path is explicitly set to root
      });
      
      return next();
    }

    // Check if user is already authenticated via Passport session
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('User authenticated via session for regular route');
      return next();
    }

    // Get token from Authorization header or cookies
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // If no token and not authenticated via session, return error
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access', 401));
    }

    // Log information about the token we're trying to verify
    console.log('\n--- JWT Verification Attempt ---');
    console.log('Request path:', req.path);
    console.log('Token provided:', token ? token.substring(0, 10) + '...' : 'No');
    console.log('JWT_SECRET first 10 chars:', JWT_SECRET.substring(0, 10));
    
    // Use our helper function to verify the token
    const decoded = verifyToken(token);
    
    // If token verification failed, return error
    if (!decoded) {
      // Log more details for debugging
      console.log('Token verification failed for path:', req.path);
      console.log('--- End JWT Verification Attempt ---');
      return next(new AppError('Authentication failed. Please log in again', 401));
    }
    
    console.log('Token verified successfully');
    console.log('--- End JWT Verification Attempt ---');

    // Check if token was issued after our JWT_ISSUED_AFTER timestamp
    // This ensures tokens issued with the old secret are rejected
    // Skip this check if JWT_ISSUED_AFTER is 0
    if (JWT_ISSUED_AFTER > 0 && decoded.iat && decoded.iat < JWT_ISSUED_AFTER) {
      console.log('Token was issued before the last secret update. Rejecting...');
      return next(new AppError('Your login has expired. Please log in again', 401));
    }

    // Check if user id exists in decoded token
    if (!decoded.id && !decoded.userId) {
      return next(new AppError('Invalid token. Please log in again', 401));
    }

    // Set userId from either id or userId property
    const userId = decoded.id || decoded.userId;

    // Check if user still exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = user;
    res.locals.user = user;
    
    // Refresh the cookie to extend session
    const newToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/' // Ensure path is explicitly set to root
    });
    
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    // For semi-protected routes with GET, we already handled above
    next(new AppError('Authentication failed. Please try again', 401));
  }
};

/**
 * Optional authentication
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalToken = async (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      // No token, but that's okay - proceed without auth
      return next();
    }

    // 2) Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token was issued after our JWT_ISSUED_AFTER timestamp
    if (JWT_ISSUED_AFTER > 0 && decoded.iat && decoded.iat < JWT_ISSUED_AFTER) {
      console.log('Token was issued before the last secret update. Proceeding as guest...');
      return next();
    }

    // 3) Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      // No user, but that's okay - proceed without auth
      return next();
    }

    // ATTACH USER TO REQUEST
    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    // Any error, just proceed without auth
    next();
  }
};

/**
 * Refresh token handler
 * Creates new tokens using a valid refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // If no refresh token in body, check cookies
    let token = refreshToken;
    if (!token && req.cookies && req.cookies.refresh_token) {
      token = req.cookies.refresh_token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No refresh token provided' 
      });
    }
    
    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired refresh token' 
      });
    }
    
    // Get user from database
    const userId = decoded.id || decoded.userId;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Generate new tokens
    const newAccessToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const newRefreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Set new cookies
    res.cookie('jwt', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    // Return new tokens
    return res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred during token refresh' 
    });
  }
};

/**
 * Role-based authorization middleware
 * Restricts access to specified roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

/**
 * Admin role authorization middleware
 */
const isAdmin = (req, res, next) => {
  // Check if user exists on the request
  if (!req.user) {
    console.log('Admin access denied: No user in request');
    return res.status(401).json({
      status: 'fail',
      message: 'Authentication required. Please log in again.'
    });
  }

  // Check for admin role
  if (req.user.role !== 'admin') {
    console.log('Access denied: User role is', req.user.role, 'but admin role required');
    return res.status(403).json({
      status: 'fail',
      message: 'Admin role required for this operation'
    });
  }
  
  // Admin access granted
  console.log('Admin access granted for user ID:', req.user.id || req.user.userId);
  next();
};

/**
 * Restaurant role authorization middleware
 */
const isRestaurant = (req, res, next) => {
  if (req.user.role !== 'restaurant') {
    return next(new AppError('Restaurant role required for this operation', 403));
  }
  next();
};

/**
 * Driver role authorization middleware
 */
const isDriver = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return next(new AppError('Driver role required for this operation', 403));
  }
  next();
};

/**
 * Customer role authorization middleware
 */
const isCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return next(new AppError('Customer role required for this operation', 403));
  }
  next();
};

/**
 * Verify restaurant owner
 * Ensures a restaurant user can only modify their own restaurant
 */
const verifyRestaurantOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Skip for admin users (they can modify any restaurant)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For restaurant users, verify they own the restaurant
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findByPk(id);
      
      if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
      }
      
      if (restaurant.userId !== req.user.id) {
        return next(new AppError('You do not have permission to perform this action on this restaurant', 403));
      }
      
      return next();
    }
    
    // For other roles, deny access
    return next(new AppError('You do not have permission to perform this action', 403));
  } catch (error) {
    return next(error);
  }
};

/**
 * Simplified token verification without database lookup
 * Used for faster authentication checks
 */
const verifyTokenMiddleware = (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access'
      });
    }

    // 2) Use our helper function to verify the token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication failed. Please log in again.'
      });
    }
    
    // Check if token was issued after our JWT_ISSUED_AFTER timestamp
    if (JWT_ISSUED_AFTER > 0 && decoded.iat && decoded.iat < JWT_ISSUED_AFTER) {
      console.log('Token was issued before the last secret update. Rejecting...');
      return res.status(401).json({
        status: 'fail',
        message: 'Your login has expired. Please log in again.'
      });
    }
    
    // Ensure we always have a standard user object with id field
    if (!decoded.id && decoded.userId) {
      decoded.id = decoded.userId;
    } else if (!decoded.userId && decoded.id) {
      decoded.userId = decoded.id;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Authentication failed'
    });
  }
};

module.exports = {
  protect: authMiddleware,
  authMiddleware,
  restrictTo,
  verifyRestaurantOwner,
  verifyTokenMiddleware,
  isAdmin,
  isRestaurant,
  isDriver,
  isCustomer,
  optionalToken,
  refreshToken,
  AppError
};