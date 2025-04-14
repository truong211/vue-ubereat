const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  markNotificationAsRead
} = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Only protected routes need authentication

// Public routes
router.get('/', getNotifications);
router.get('/preferences', getNotificationPreferences);

// Protected routes
router.put('/preferences', authMiddleware, updateNotificationPreferences);
router.put('/:id/read', authMiddleware, markNotificationAsRead);

module.exports = router;