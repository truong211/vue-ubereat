const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const settingsController = require('../controllers/restaurantSettings.controller');
const settingsValidator = require('../middleware/restaurantSettings.validator');

// All routes require authentication
router.use(protect);

// Get restaurant settings
router.get('/:id/settings', settingsController.getRestaurantSettings);

// Update operating hours
router.patch(
  '/:id/operating-hours',
  restrictTo('restaurant', 'admin'),
  settingsValidator.validateOperatingHours,
  settingsController.updateOperatingHours
);

// Update special holidays
router.patch(
  '/:id/special-holidays',
  restrictTo('restaurant', 'admin'),
  settingsValidator.validateSpecialHolidays,
  settingsController.updateSpecialHolidays
);

// Update delivery settings
router.patch(
  '/:id/delivery-settings',
  restrictTo('restaurant', 'admin'),
  settingsValidator.validateDeliverySettings,
  settingsController.updateDeliverySettings
);

// Update menu availability
router.patch(
  '/:id/menu-availability',
  restrictTo('restaurant', 'admin'),
  settingsValidator.validateMenuAvailability,
  settingsController.updateMenuAvailability
);

// Update temporary closure
router.patch(
  '/:id/temporary-closure',
  restrictTo('restaurant', 'admin'),
  settingsValidator.validateTemporaryClosure,
  settingsController.updateTemporaryClosure
);

// Update real-time availability status
router.patch(
  '/:id/availability-status',
  restrictTo('restaurant', 'admin'),
  settingsValidator.validateAvailabilityStatus,
  settingsController.updateAvailabilityStatus
);

module.exports = router;