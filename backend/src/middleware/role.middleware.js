const { AppError } = require('./error.middleware');

/**
 * Middleware to check if user has required role(s)
 * @param {string[]} roles - Array of allowed roles
 * @returns {function} Middleware function
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

module.exports = {
  checkRole
};