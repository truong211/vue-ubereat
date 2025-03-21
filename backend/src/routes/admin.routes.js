const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply authentication and admin authorization to all routes
router.use(authenticate, authorize('admin'));

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

// User Management
router.patch('/users/:id/status', adminController.updateUserStatus);

// Marketing Content Management
router.get('/marketing', adminController.getMarketingContent);
router.post('/marketing', adminController.createMarketingContent);

// Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Banner Management
router.get('/banners', adminController.getBanners);
router.post('/banners', adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

// Static Page Management
router.get('/pages', adminController.getStaticPages);
router.post('/pages', adminController.createStaticPage);
router.put('/pages/:id', adminController.updateStaticPage);
router.delete('/pages/:id', adminController.deleteStaticPage);

// Site Configuration
router.get('/config', adminController.getSiteConfig);
router.put('/config', adminController.updateSiteConfig);

module.exports = router;