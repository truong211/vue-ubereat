const express = require('express');
const router = express.Router();
const path = require('path');
const controllerPath = path.resolve(__dirname, '../controllers/analytics.controller.js');
console.log('Controller path:', controllerPath);
console.log('File exists:', require('fs').existsSync(controllerPath));
const analyticsController = require(controllerPath);
console.log('Analytics Controller keys:', Object.keys(analyticsController || {}));
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Admin Analytics Overview (redirect to dashboard)
router.get('/', protect, restrictTo('admin'), (req, res) => {
  res.redirect('/api/analytics/dashboard/1'); // Redirect to main dashboard
});

// Restaurant Analytics Routes
router.get('/revenue/:restaurantId', protect, analyticsController.getRevenueAnalytics);
router.get('/menu/:restaurantId', protect, analyticsController.getMenuAnalytics);
router.get('/customers/:restaurantId', protect, analyticsController.getCustomerAnalytics);
router.get('/orders/:restaurantId', protect, analyticsController.getOrderAnalytics);

// Dashboard Overview
router.get('/dashboard/:restaurantId', protect, analyticsController.getDashboardOverview);

module.exports = router;