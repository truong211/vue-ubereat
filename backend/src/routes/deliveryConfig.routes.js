const express = require('express');
const router = express.Router();
const deliveryConfigController = require('../controllers/deliveryConfig.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/global', deliveryConfigController.getGlobalDeliveryConfig);
router.get('/restaurant/:restaurantId', deliveryConfigController.getDeliveryConfigByRestaurantId);
router.post('/calculate-fee', deliveryConfigController.calculateDeliveryFee);

// Protected routes
router.get('/', 
  authenticate, 
  authorize('admin'), 
  deliveryConfigController.getAllDeliveryConfigs
);

router.post('/', 
  authenticate, 
  authorize('admin', 'restaurant'), 
  deliveryConfigController.createDeliveryConfig
);

router.put('/:id', 
  authenticate, 
  authorize('admin', 'restaurant'), 
  deliveryConfigController.updateDeliveryConfig
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'), 
  deliveryConfigController.deleteDeliveryConfig
);

module.exports = router; 