const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const mapController = require('../controllers/map.controller');
const { body, query } = require('express-validator');

/**
 * Geocoding routes
 */
// Geocode an address to get coordinates
router.post(
  '/geocode',
  [
    body('address').notEmpty().withMessage('Address is required')
  ],
  mapController.geocodeAddress
);

// Reverse geocode coordinates to get address
router.post(
  '/reverse-geocode',
  [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ],
  mapController.reverseGeocode
);

/**
 * Distance and directions routes
 */
// Calculate distance between two points
router.post(
  '/distance',
  [
    body('origin.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid origin latitude'),
    body('origin.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid origin longitude'),
    body('destination.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid destination latitude'),
    body('destination.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid destination longitude')
  ],
  mapController.calculateDistance
);

// Get directions between two points
router.post(
  '/directions',
  [
    body('origin.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid origin latitude'),
    body('origin.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid origin longitude'),
    body('destination.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid destination latitude'),
    body('destination.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid destination longitude'),
    body('travelMode').optional().isIn(['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT']).withMessage('Invalid travel mode')
  ],
  mapController.getDirections
);

/**
 * Restaurant location routes
 */
// Get nearby restaurants based on location
router.get(
  '/restaurants/nearby',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Invalid radius (0.1-50 km)')
  ],
  mapController.getNearbyRestaurants
);

// Get restaurant locations for map display
router.get(
  '/restaurants/locations',
  [
    query('bounds.ne.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid northeast latitude'),
    query('bounds.ne.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid northeast longitude'),
    query('bounds.sw.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid southwest latitude'),
    query('bounds.sw.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid southwest longitude')
  ],
  mapController.getRestaurantLocations
);

/**
 * Delivery zone routes
 */
// Check if location is in delivery zone
router.post(
  '/delivery-zone/check',
  [
    body('restaurantId').isInt().withMessage('Restaurant ID must be an integer'),
    body('userLocation.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid user latitude'),
    body('userLocation.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid user longitude')
  ],
  mapController.checkDeliveryZone
);

// Get delivery zones for a restaurant
router.get(
  '/delivery-zones/:restaurantId',
  mapController.getRestaurantDeliveryZones
);

/**
 * ETA calculation routes
 */
// Calculate estimated delivery time
router.post(
  '/eta/calculate',
  [
    body('restaurantLocation.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid restaurant latitude'),
    body('restaurantLocation.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid restaurant longitude'),
    body('userLocation.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid user latitude'),
    body('userLocation.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid user longitude'),
    body('orderStatus').optional().isIn(['preparing', 'ready_for_pickup', 'out_for_delivery']).withMessage('Invalid order status')
  ],
  mapController.calculateETA
);

// Update ETA based on real-time traffic
router.post(
  '/eta/update',
  protect,
  [
    body('orderId').isInt().withMessage('Order ID must be an integer'),
    body('currentLocation.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid current latitude'),
    body('currentLocation.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid current longitude')
  ],
  mapController.updateETAWithTraffic
);

module.exports = router;