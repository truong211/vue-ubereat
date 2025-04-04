/**
 * Error classes and middleware for handling API errors
 */

// Custom AppError class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found middleware
 * Used as the last middleware in the stack to handle undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler middleware
 * Formats errors into a consistent response format
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';
  let status = err.status || 'error';
  let stack = process.env.NODE_ENV === 'production' ? null : err.stack;
  let errors = err.errors || null;
  let code = err.code || null;
  
  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    status = 'fail';
    message = 'Validation failed';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid token. Please log in again';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Your token has expired. Please log in again';
  }
  
  // Handle Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    status = 'fail';
    message = 'File too large. Maximum size is 5MB';
  }
  
  // Handle database connection errors
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    statusCode = 503;
    status = 'error';
    message = 'Database connection error';
  }
  
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('ERROR 💥:', err);
  }
  
  // Send error response
  res.status(statusCode).json({
    status,
    message,
    code,
    errors,
    stack
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler
}; 