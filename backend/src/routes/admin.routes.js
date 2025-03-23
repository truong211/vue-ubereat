const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const articleController = require('../controllers/article.controller');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// Apply authentication and admin authorization to all routes
router.use(authenticate, authorize('admin'));

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['customer', 'restaurant', 'driver', 'admin']).withMessage('Invalid role'),
], adminController.createUser);
router.put('/users/:id', [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['customer', 'restaurant', 'driver', 'admin']).withMessage('Invalid role'),
], adminController.updateUser);
router.patch('/users/:id/status', [
  body('status').isIn(['active', 'suspended']).withMessage('Invalid status'),
  body('reason').if(body('status').equals('suspended')).notEmpty().withMessage('Reason required for suspension'),
], adminController.updateUserStatus);

// Dashboard and Analytics
router.get('/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/recent-activities', adminController.getRecentActivities);

// System Monitoring
router.get('/system/metrics', adminController.getSystemMetrics);
router.get('/system/performance', adminController.getApiPerformance);
router.get('/user-activity', adminController.getUserActivityLogs);

// Restaurant Management
router.patch('/restaurants/:id/status', adminController.updateRestaurantStatus);

// Content Management - Articles
router.get('/articles', articleController.getArticles);
router.post('/articles', [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').optional().isIn(['news', 'blog', 'guide', 'faq']).withMessage('Invalid article type'),
  body('published').optional().isBoolean().withMessage('Published must be a boolean'),
], articleController.createArticle);
router.get('/articles/:slug', articleController.getArticle);
router.put('/articles/:id', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('type').optional().isIn(['news', 'blog', 'guide', 'faq']).withMessage('Invalid article type'),
  body('published').optional().isBoolean().withMessage('Published must be a boolean'),
], articleController.updateArticle);
router.delete('/articles/:id', articleController.deleteArticle);

// FAQ Management
router.get('/faqs', adminController.getFAQs);
router.post('/faqs', [
  body('question').notEmpty().withMessage('Question is required'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('order').optional().isNumeric().withMessage('Order must be a number'),
], adminController.createFAQ);
router.put('/faqs/:id', [
  body('question').optional().notEmpty().withMessage('Question cannot be empty'),
  body('answer').optional().notEmpty().withMessage('Answer cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('order').optional().isNumeric().withMessage('Order must be a number'),
], adminController.updateFAQ);
router.delete('/faqs/:id', adminController.deleteFAQ);

// Banner Management
router.get('/banners', adminController.getBanners);
router.post('/banners', [
  body('title').notEmpty().withMessage('Title is required'),
  body('imageUrl').notEmpty().withMessage('Image URL is required'),
  body('linkTo').optional(),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  body('position').notEmpty().withMessage('Position is required'),
  body('priority').optional().isNumeric().withMessage('Priority must be a number'),
], adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

// System Notification Management
router.get('/system-notifications', adminController.getSystemNotifications);
router.post('/system-notifications', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['all', 'customers', 'restaurants', 'drivers']).withMessage('Invalid audience type'),
  body('userIds').optional().isArray().withMessage('User IDs must be an array'),
  body('scheduledFor').optional().isISO8601().withMessage('Scheduled date must be a valid date'),
], adminController.createSystemNotification);
router.put('/system-notifications/:id', adminController.updateSystemNotification);
router.delete('/system-notifications/:id', adminController.deleteSystemNotification);
router.post('/system-notifications/:id/send', adminController.sendSystemNotification);

// Static Page Management
router.get('/pages', adminController.getStaticPages);
router.post('/pages', adminController.createStaticPage);
router.put('/pages/:id', adminController.updateStaticPage);
router.delete('/pages/:id', adminController.deleteStaticPage);

// Site Configuration
router.get('/config', adminController.getSiteConfig);
router.put('/config', adminController.updateSiteConfig);

module.exports = router;