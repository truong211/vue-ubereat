// filepath: d:\vuejs-ubereat\backend\src\middleware\activityLogger.middleware.js
const { UserActivityLog } = require('../models');

/**
 * Middleware factory that creates activity logging middleware for specific action types
 * @param {string} activityType - The type of activity being logged
 * @returns {Function} Express middleware
 */
const logUserActivity = (activityType) => {
  return (req, res, next) => {
    // We'll use the event emitter pattern to avoid blocking the response
    const originalEnd = res.end;
    
    res.end = function(...args) {
      // Only log activity if the request was successful and user is authenticated
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const ipAddress = req.ip || 
                          req.headers['x-forwarded-for'] || 
                          req.socket.remoteAddress;
        
        // Create activity details based on the request
        const details = {
          action: activityType,
          method: req.method,
          path: req.originalUrl,
          body: req.method !== 'GET' ? req.body : undefined,
          params: req.params,
          query: req.query
        };
        
        // Log the activity
        UserActivityLog.create({
          userId: req.user.id,
          activityType,
          details,
          ipAddress,
          userAgent: req.headers['user-agent']
        }).catch(err => console.error('Error logging user activity:', err));
      }
      
      // Call the original end method
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};

/**
 * Convenience methods for common activity types
 */
const logLogin = logUserActivity('login');
const logLogout = logUserActivity('logout');
const logOrder = logUserActivity('order_created');
const logProfileUpdate = logUserActivity('profile_updated');
const logAddressUpdate = logUserActivity('address_updated');
const logReview = logUserActivity('review_submitted');
const logRestaurantAction = logUserActivity('restaurant_action');

const activityLogger = (activityType) => async (req, res, next) => {
  try {
    if (req.user) {
      await UserActivityLog.create({
        userId: req.user.id,
        activityType,
        details: {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
  next();
};

module.exports = {
  logUserActivity,
  logLogin,
  logLogout,
  logOrder,
  logProfileUpdate,
  logAddressUpdate,
  logReview,
  logRestaurantAction,
  activityLogger
};