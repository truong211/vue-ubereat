const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Get restaurant dashboard statistics
router.get(
  '/restaurant/:restaurantId',
  protect,
  dashboardController.getRestaurantStats
);

// Get customer dashboard statistics
router.get(
  '/customer',
  protect,
  dashboardController.getCustomerStats
);

// Get admin dashboard statistics
router.get(
  '/admin',
  protect,
  restrictTo('admin'),
  dashboardController.getAdminStats
);

module.exports = router;