const { AppError } = require('./error.middleware');

/**
 * Middleware to check if user is an admin or super admin
 */
exports.isAdmin = (req, res, next) => {
  try {
    // Verify user exists and has the appropriate role
    if (!req.user) {
      return next(new AppError('Unauthorized - please log in', 401));
    }

    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(new AppError('Access denied - admin privileges required', 403));
    }

    // User is an admin, proceed
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is a super admin
 */
exports.isSuperAdmin = (req, res, next) => {
  try {
    // Verify user exists and has the appropriate role
    if (!req.user) {
      return next(new AppError('Unauthorized - please log in', 401));
    }

    // Check if user has super admin role
    if (req.user.role !== 'superadmin') {
      return next(new AppError('Access denied - super admin privileges required', 403));
    }

    // User is a super admin, proceed
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has a specific permission
 * @param {string} permission - The permission to check for
 */
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      // Verify user exists
      if (!req.user) {
        return next(new AppError('Unauthorized - please log in', 401));
      }

      // Super admins have all permissions
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Check if user has the specific permission
      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        return next(new AppError(`Access denied - "${permission}" permission required`, 403));
      }

      // User has the required permission
      next();
    } catch (error) {
      next(error);
    }
  };
}; 