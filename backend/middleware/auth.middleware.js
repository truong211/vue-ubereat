const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No auth token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Get user from database to ensure they still exist and are active
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Optional token verification - doesn't return error if no token present
exports.optionalToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findByPk(decoded.id);
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        };
      }
    } catch (error) {
      // Ignore token validation errors for optional auth
      console.warn('Optional auth token validation failed:', error.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};