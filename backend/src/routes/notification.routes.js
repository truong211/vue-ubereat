const express = require('express');
const router = express.Router();
const notifications = require('../controllers/notification.controller');
const { isAdmin } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// Subscription management routes
router.post('/subscribe', notifications.subscribe);
router.post('/unsubscribe', notifications.unsubscribe);

// Preference management routes
router.get('/preferences', notifications.getPreferences);
router.put('/preferences', [
  body('orderUpdates').optional().isBoolean(),
  body('promotions').optional().isBoolean(),
  body('driverLocation').optional().isBoolean(),
  body('marketing').optional().isBoolean(),
  body('email').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('sms').optional().isBoolean()
], notifications.updatePreferences);

// Notification management routes
router.get('/', notifications.getUserNotifications);
router.get('/unread/count', notifications.getUnreadCount);
router.get('/counts', notifications.getNotificationCounts);
router.patch('/read', notifications.markAsRead);
router.patch('/read-all', notifications.markAllAsRead);
router.delete('/:id', notifications.delete);

// Tracking routes
router.post('/:notificationId/track-delivery', [
  body('status').isIn(['sent', 'delivered', 'failed', 'clicked']).withMessage('Invalid status'),
  body('deviceInfo').optional().isObject(),
  body('errorDetails').optional().isString()
], notifications.trackDelivery);

router.post('/:notificationId/track-click', notifications.trackClick);

// Analytics routes
router.get('/delivery-stats', [isAdmin], notifications.getDeliveryStats);
router.get('/performance-by-type', [isAdmin], notifications.getPerformanceByType);
router.get('/best-performing-time-slots', [isAdmin], notifications.getBestPerformingTimeSlots);
router.get('/:userId/engagement', [isAdmin], notifications.getUserEngagement);

// Admin only routes
router.post('/', [
  isAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').notEmpty().withMessage('Notification type is required'),
  body('userIds').optional().isArray(),
  body('isSystemWide').optional().isBoolean(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('validUntil').optional().isISO8601()
], notifications.create);

router.patch('/:id/status', [
  isAdmin,
  body('active').isBoolean()
], notifications.updateStatus);

module.exports = router;