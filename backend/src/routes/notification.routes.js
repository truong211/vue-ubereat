const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

// All routes require authentication
router.use(protect);

// Subscribe to push notifications
router.post('/subscribe', notificationController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', notificationController.unsubscribe);

// Get user's notification preferences
router.get('/preferences', notificationController.getPreferences);

// Update user's notification preferences
router.put('/preferences', notificationController.updatePreferences);

// Get user's notifications with filters and pagination
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Get notification counts (total and by type)
router.get('/counts', notificationController.getNotificationCounts);

module.exports = router;