const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const trackingController = require('../controllers/tracking.controller');
const { body } = require('express-validator');

/**
 * Driver location routes
 */
// Update driver location (drivers only)
router.post(
  '/location',
  protect,
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('heading').optional().isInt({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360 degrees'),
    body('speed').optional().isFloat({ min: 0 }).withMessage('Speed must be positive'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be positive'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean')
  ],
  trackingController.updateDriverLocation
);

// Get driver location (for customers tracking their order)
router.get('/driver/:driverId', protect, trackingController.getDriverLocation);

/**
 * Order tracking routes
 */
// Get all tracking info for an order
router.get('/order/:orderId', protect, trackingController.getOrderTracking);

module.exports = router;