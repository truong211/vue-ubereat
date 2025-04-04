const express = require('express');
const router = express.Router();
const deliveryConfigController = require('../controllers/deliveryConfig.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public routes
router.get('/global', deliveryConfigController.getGlobalDeliveryConfig);
router.get('/restaurant/:restaurantId', deliveryConfigController.getDeliveryConfigByRestaurantId);
router.post('/calculate-fee', deliveryConfigController.calculateDeliveryFee);

// Protected routes
router.get('/', 
  protect, 
  restrictTo('admin'), 
  deliveryConfigController.getAllDeliveryConfigs
);

router.post('/', 
  protect, 
  restrictTo('admin', 'restaurant'), 
  deliveryConfigController.createDeliveryConfig
);

router.put('/:id', 
  protect, 
  restrictTo('admin', 'restaurant'), 
  deliveryConfigController.updateDeliveryConfig
);

router.delete('/:id', 
  protect, 
  restrictTo('admin'), 
  deliveryConfigController.deleteDeliveryConfig
);

module.exports = router; 