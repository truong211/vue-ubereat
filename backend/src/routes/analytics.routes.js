const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Admin Analytics Routes
router.get('/', protect, restrictTo('admin'), analyticsController.getAnalytics);
router.post('/export', protect, restrictTo('admin'), analyticsController.exportAnalytics);

// Restaurant Analytics Routes
router.get('/revenue/:restaurantId', protect, analyticsController.getRevenueAnalytics);
router.get('/menu/:restaurantId', protect, analyticsController.getMenuAnalytics);
router.get('/customers/:restaurantId', protect, analyticsController.getCustomerAnalytics);

// Dashboard Statistics
router.get('/revenue-stats/:restaurantId', protect, analyticsController.getRevenueStats);
router.get('/popular-items/:restaurantId', protect, analyticsController.getPopularItems);
router.get('/order-statistics/:restaurantId', protect, analyticsController.getOrderStatistics);
router.get('/customer-analytics/:restaurantId', protect, analyticsController.getCustomerAnalytics);

module.exports = router;