const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Route calculation
router.post('/route', authMiddleware, mapController.calculateRoute);

// Distance matrix calculation
router.post('/distance-matrix', authMiddleware, mapController.getDistanceMatrix);

// Geocoding services
router.get('/geocode', authMiddleware, mapController.geocodeAddress);
router.get('/reverse-geocode', authMiddleware, mapController.reverseGeocode);

// Restaurant location services
router.get('/restaurants/nearby', mapController.getNearbyRestaurants); // Public endpoint
router.get('/restaurants/:id/location', mapController.getRestaurantLocation); // Public endpoint

// Delivery tracking
router.get('/drivers/:id/location', authMiddleware, mapController.getDriverLocation);
router.post('/drivers/:id/location', authMiddleware, mapController.updateDriverLocation);

// Order location services
router.get('/orders/:id/delivery-location', authMiddleware, mapController.getOrderDeliveryLocation);
router.get('/orders/:id/route', authMiddleware, mapController.getOrderRoute);
router.get('/orders/:id/eta', authMiddleware, mapController.getOrderETA);

// Optimization services
router.post('/optimize-route', authMiddleware, mapController.optimizeDeliveryRoute);
router.post('/estimate-delivery-time', mapController.estimateDeliveryTime); // Public endpoint

module.exports = router;