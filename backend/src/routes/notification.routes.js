const express = require('express');
const router = express.Router();
const notifications = require('../controllers/notification.controller');
const { authJwt } = require('../middleware');
const { body } = require('express-validator');

// Subscription management routes
router.post('/subscribe', authJwt.verifyToken, notifications.subscribe);
router.post('/unsubscribe', authJwt.verifyToken, notifications.unsubscribe);

// Preference management routes
router.get('/preferences', authJwt.verifyToken, notifications.getPreferences);
router.put('/preferences', [
  authJwt.verifyToken,
  body('orderUpdates').optional().isBoolean(),
  body('promotions').optional().isBoolean(),
  body('driverLocation').optional().isBoolean(),
  body('marketing').optional().isBoolean(),
  body('email').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('sms').optional().isBoolean()
], notifications.updatePreferences);

// Notification management routes
router.get('/', authJwt.verifyToken, notifications.getUserNotifications);
router.get('/unread/count', authJwt.verifyToken, notifications.getUnreadCount);
router.get('/counts', authJwt.verifyToken, notifications.getNotificationCounts);
router.patch('/read', authJwt.verifyToken, notifications.markAsRead);
router.patch('/read-all', authJwt.verifyToken, notifications.markAllAsRead);
router.delete('/:id', authJwt.verifyToken, notifications.deleteNotification);

// Tracking routes
router.post('/:notificationId/track-delivery', [
  authJwt.verifyToken,
  body('status').isIn(['sent', 'delivered', 'failed', 'clicked']).withMessage('Invalid status'),
  body('deviceInfo').optional().isObject(),
  body('errorDetails').optional().isString()
], notifications.trackDelivery);

router.post('/:notificationId/track-click', authJwt.verifyToken, notifications.trackClick);

// Analytics routes
router.get('/delivery-stats', [authJwt.verifyToken, authJwt.isAdmin], notifications.getDeliveryStats);
router.get('/performance-by-type', [authJwt.verifyToken, authJwt.isAdmin], notifications.getPerformanceByType);
router.get('/best-performing-time-slots', [authJwt.verifyToken, authJwt.isAdmin], notifications.getBestPerformingTimeSlots);
router.get('/:userId/engagement', [authJwt.verifyToken, authJwt.isAdmin], notifications.getUserEngagement);

// Admin only routes
router.post('/', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').notEmpty().withMessage('Notification type is required'),
  body('userIds').optional().isArray(),
  body('isSystemWide').optional().isBoolean(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('validUntil').optional().isISO8601()
], notifications.create);

router.patch('/:id/status', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('active').isBoolean()
], notifications.updateStatus);

module.exports = app => {
  app.use('/api/notifications', router);
};