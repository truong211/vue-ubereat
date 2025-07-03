const express = require('express');
const router = express.Router();
const MapController = require('../controllers/map.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, query, param } = require('express-validator');

// Restaurant Discovery Routes
router.get('/restaurants/nearby', 
  optionalAuth,
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km'),
    query('cuisineType').optional().isString(),
    query('rating').optional().isFloat({ min: 0, max: 5 }),
    query('priceRange').optional().isIn(['$', '$$', '$$$', '$$$$']),
    query('sortBy').optional().isIn(['distance', 'rating', 'deliveryTime', 'deliveryFee']),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  MapController.findNearbyRestaurants
);

router.get('/restaurants/search',
  optionalAuth,
  [
    query('q').isLength({ min: 1 }).withMessage('Search query is required'),
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km')
  ],
  validateRequest,
  MapController.searchRestaurants
);

router.post('/restaurants/recommendations',
  authenticateToken,
  [
    body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('preferences').optional().isObject()
  ],
  validateRequest,
  MapController.getRecommendedRestaurants
);

// Route Calculation Routes
router.post('/route',
  optionalAuth,
  [
    body('origin.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid origin latitude'),
    body('origin.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid origin longitude'),
    body('destination.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid destination latitude'),
    body('destination.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid destination longitude'),
    body('mode').optional().isIn(['driving', 'walking', 'bicycling', 'transit']),
    body('alternatives').optional().isBoolean(),
    body('waypoints').optional().isArray()
  ],
  validateRequest,
  MapController.calculateRoute
);

router.post('/route/optimize',
  authenticateToken,
  [
    body('origin.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid origin latitude'),
    body('origin.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid origin longitude'),
    body('destinations').isArray({ min: 1 }).withMessage('At least one destination is required'),
    body('destinations.*.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid destination latitude'),
    body('destinations.*.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid destination longitude')
  ],
  validateRequest,
  MapController.optimizeRoute
);

router.post('/distance-matrix',
  optionalAuth,
  [
    body('origins').isArray({ min: 1, max: 25 }).withMessage('Origins array required (max 25)'),
    body('destinations').isArray({ min: 1, max: 25 }).withMessage('Destinations array required (max 25)'),
    body('origins.*.lat').isFloat({ min: -90, max: 90 }),
    body('origins.*.lng').isFloat({ min: -180, max: 180 }),
    body('destinations.*.lat').isFloat({ min: -90, max: 90 }),
    body('destinations.*.lng').isFloat({ min: -180, max: 180 }),
    body('mode').optional().isIn(['driving', 'walking', 'bicycling', 'transit'])
  ],
  validateRequest,
  MapController.calculateDistanceMatrix
);

// Geocoding Routes
router.get('/geocode',
  optionalAuth,
  [
    query('address').isLength({ min: 1 }).withMessage('Address is required')
  ],
  validateRequest,
  MapController.geocodeAddress
);

router.get('/reverse-geocode',
  optionalAuth,
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ],
  validateRequest,
  MapController.reverseGeocode
);

// Real-time Tracking Routes
router.get('/orders/:orderId/tracking',
  authenticateToken,
  [
    param('orderId').isUUID().withMessage('Invalid order ID')
  ],
  validateRequest,
  MapController.getOrderTracking
);

router.get('/orders/:orderId/eta',
  authenticateToken,
  [
    param('orderId').isUUID().withMessage('Invalid order ID')
  ],
  validateRequest,
  MapController.calculateOrderEta
);

router.get('/orders/:orderId/delivery-location',
  authenticateToken,
  [
    param('orderId').isUUID().withMessage('Invalid order ID')
  ],
  validateRequest,
  MapController.getDeliveryLocation
);

router.get('/drivers/:driverId/location',
  authenticateToken,
  [
    param('driverId').isUUID().withMessage('Invalid driver ID')
  ],
  validateRequest,
  MapController.getDriverLocation
);

router.put('/drivers/:driverId/location',
  authenticateToken,
  [
    param('driverId').isUUID().withMessage('Invalid driver ID'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('heading').optional().isFloat({ min: 0, max: 360 }),
    body('speed').optional().isFloat({ min: 0 }),
    body('accuracy').optional().isFloat({ min: 0 })
  ],
  validateRequest,
  MapController.updateDriverLocation
);

router.get('/restaurants/:restaurantId/location',
  optionalAuth,
  [
    param('restaurantId').isUUID().withMessage('Invalid restaurant ID')
  ],
  validateRequest,
  MapController.getRestaurantLocation
);

// Traffic and Conditions Routes
router.get('/traffic/conditions',
  optionalAuth,
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 20 }).withMessage('Radius must be between 0.1 and 20 km')
  ],
  validateRequest,
  MapController.getTrafficConditions
);

router.get('/delivery-zones',
  optionalAuth,
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ],
  validateRequest,
  MapController.getDeliveryZones
);

// Map Analytics Routes
router.get('/analytics/delivery-heatmap',
  authenticateToken,
  [
    query('timeRange').optional().isIn(['today', 'week', 'month']),
    query('bounds.north').optional().isFloat({ min: -90, max: 90 }),
    query('bounds.south').optional().isFloat({ min: -90, max: 90 }),
    query('bounds.east').optional().isFloat({ min: -180, max: 180 }),
    query('bounds.west').optional().isFloat({ min: -180, max: 180 })
  ],
  validateRequest,
  MapController.getDeliveryHeatmap
);

router.get('/analytics/popular-routes',
  authenticateToken,
  [
    query('restaurantId').optional().isUUID(),
    query('timeRange').optional().isIn(['today', 'week', 'month']),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  MapController.getPopularRoutes
);

// Map Configuration Routes
router.get('/config',
  optionalAuth,
  MapController.getMapConfig
);

router.get('/supported-regions',
  optionalAuth,
  MapController.getSupportedRegions
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Map route error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details
    });
  }
  
  if (error.name === 'ExternalAPIError') {
    return res.status(503).json({
      success: false,
      message: 'External map service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;