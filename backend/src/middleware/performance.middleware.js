// filepath: d:\vuejs-ubereat\backend\src\middleware\performance.middleware.js
const { ApiPerformanceLog } = require('../models');

/**
 * Middleware to log API performance metrics
 */
const performanceMiddleware = async (req, res, next) => {
  const start = process.hrtime();

  // Store original end function
  const originalEnd = res.end;

  // Override end function
  res.end = function (chunk, encoding) {
    // Calculate response time
    const diff = process.hrtime(start);
    const responseTime = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds

    // Log performance data
    ApiPerformanceLog.create({
      route: req.originalUrl,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      userId: req.user ? req.user.id : null
    }).catch(err => console.error('Error logging API performance:', err));

    // Call original end
    originalEnd.apply(res, arguments);
  };

  next();
};

module.exports = performanceMiddleware;