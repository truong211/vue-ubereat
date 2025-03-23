const winston = require('winston');
const path = require('path');

// Custom log format for promotions
const promotionLogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...metadata
    });
  })
);

// Create logger instance
const promotionLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: promotionLogFormat,
  transports: [
    // Log errors to a separate file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/promotion-errors.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Log all promotion activities
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/promotions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 7
    })
  ]
});

// Add console logging for development
if (process.env.NODE_ENV !== 'production') {
  promotionLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper functions for common logging patterns
const logPromotionActivity = (activity) => {
  promotionLogger.info('Promotion Activity', { 
    ...activity,
    category: 'activity'
  });
};

const logPromotionError = (error, context) => {
  promotionLogger.error('Promotion Error', {
    error: error.message,
    stack: error.stack,
    ...context,
    category: 'error'
  });
};

const logPromotionMetrics = (metrics) => {
  promotionLogger.info('Promotion Metrics', {
    ...metrics,
    category: 'metrics'
  });
};

const logSuspiciousActivity = (activity) => {
  promotionLogger.warn('Suspicious Activity', {
    ...activity,
    category: 'security'
  });
};

module.exports = {
  promotionLogger,
  logPromotionActivity,
  logPromotionError,
  logPromotionMetrics,
  logSuspiciousActivity
};