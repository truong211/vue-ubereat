const express = require('express');
const router = express.Router();
const notifications = require('../controllers/notification.controller');
const { authJwt } = require('../middleware');

module.exports = app => {
  // Create a new notification (admin only)
  router.post('/', [authJwt.verifyToken, authJwt.isAdmin], notifications.create);
  
  // Create notifications for multiple users (admin only)
  router.post('/bulk', [authJwt.verifyToken, authJwt.isAdmin], notifications.createBulk);
  
  // Create notification for all users (admin only)
  router.post('/all', [authJwt.verifyToken, authJwt.isAdmin], notifications.createForAllUsers);

  // Get all notifications for current user
  router.get('/user', [authJwt.verifyToken], notifications.findAllForUser);
  
  // Get all notifications (admin only)
  router.get('/', [authJwt.verifyToken, authJwt.isAdmin], notifications.findAll);
  
  // Mark a notification as read
  router.put('/:id/read', [authJwt.verifyToken], notifications.markAsRead);
  
  // Mark all notifications as read for current user
  router.put('/read-all', [authJwt.verifyToken], notifications.markAllAsRead);
  
  // Delete a notification (admin only)
  router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], notifications.delete);
  
  // Update user notification preferences
  router.put('/preferences', [authJwt.verifyToken], notifications.updatePreferences);
  
  // Get user notification preferences
  router.get('/preferences', [authJwt.verifyToken], notifications.getPreferences);

  app.use('/api/notifications', router);
};