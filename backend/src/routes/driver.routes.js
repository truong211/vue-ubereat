// filepath: d:\vue-ubereat\backend\src\routes\driver.routes.js
const router = require('express').Router();
const { check } = require('express-validator');
const driverController = require('../controllers/driver.controller');
const { verifyToken, isAdmin, isDriver } = require('../middleware/authJwt');

// Get all drivers - accessible by admin and restaurant owners
router.get('/', 
  [verifyToken], 
  driverController.getAllDrivers
);

// Get nearby drivers - accessible by restaurant owners and admin
router.get('/nearby', 
  [verifyToken],
  driverController.getNearbyDrivers
);

// Assign driver to order - accessible by restaurant owners and admin
router.post('/assign', 
  [
    verifyToken,
    check('orderId').isNumeric().withMessage('Order ID must be a number'),
    check('driverId').isNumeric().withMessage('Driver ID must be a number')
  ], 
  driverController.assignDriverToOrder
);

// Get driver profile - accessible by self or admin
router.get('/:id', 
  [verifyToken], 
  driverController.getDriverProfile
);

// Update driver status - accessible by self or admin
router.patch('/:id/status', 
  [
    verifyToken,
    check('status').optional().isIn(['available', 'assigned', 'on_delivery', 'offline']).withMessage('Invalid status'),
    check('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ], 
  driverController.updateDriverStatus
);

// Update driver location - accessible only by the driver
router.patch('/:id/location', 
  [
    verifyToken, 
    isDriver,
    check('latitude').isFloat().withMessage('Latitude must be a valid decimal'),
    check('longitude').isFloat().withMessage('Longitude must be a valid decimal')
  ], 
  driverController.updateDriverLocation
);

// Get driver orders - accessible by self or admin
router.get('/:id/orders', 
  [verifyToken], 
  driverController.getDriverOrders
);

// Register driver vehicle - accessible by self or admin
router.post('/:id/vehicle', 
  [
    verifyToken,
    check('type').isIn(['motorcycle', 'car', 'bicycle', 'scooter']).withMessage('Invalid vehicle type'),
    check('model').notEmpty().withMessage('Vehicle model is required'),
    check('licensePlate').notEmpty().withMessage('License plate is required'),
    check('color').notEmpty().withMessage('Color is required')
  ], 
  driverController.registerVehicle
);

// Accept or reject order assignment - accessible only by the driver
router.patch('/:id/orders/:orderId', 
  [
    verifyToken, 
    isDriver,
    check('accept').isBoolean().withMessage('Accept must be a boolean')
  ], 
  driverController.respondToOrderAssignment
);

// Get driver earnings report - accessible by self or admin
router.get('/:id/earnings', 
  [verifyToken], 
  driverController.getDriverEarnings
);

module.exports = router;