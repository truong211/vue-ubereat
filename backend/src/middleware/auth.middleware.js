const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');
const User = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2) Check if token exists
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 3) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 5) Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
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
 * Middleware to verify restaurant ownership
 */
const verifyRestaurantOwner = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const userId = req.user.id;

    const restaurant = await Restaurant.findOne({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurant.userId !== userId && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to modify this restaurant', 403));
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authMiddleware,
  restrictTo,
  verifyRestaurantOwner
};