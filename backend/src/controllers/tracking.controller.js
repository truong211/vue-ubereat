const { validationResult } = require('express-validator');
const { DriverLocation, User, Order } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { emitToOrder, emitToUser } = require('../socket/handlers');

/**
 * Update driver location
 * @route POST /api/tracking/location
 * @access Private (Driver Only)
 */
exports.updateDriverLocation = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure user is a driver
    if (req.user.role !== 'driver') {
      return next(new AppError('Only drivers can update location', 403));
    }

    const { latitude, longitude, heading, speed, accuracy, isAvailable } = req.body;

    // Find existing driver location or create new one
    let driverLocation = await DriverLocation.findOne({
      where: { driverId: req.user.id }
    });

    if (driverLocation) {
      // Update existing location
      driverLocation.latitude = latitude;
      driverLocation.longitude = longitude;
      driverLocation.heading = heading;
      driverLocation.speed = speed;
      driverLocation.accuracy = accuracy;
      driverLocation.lastUpdated = new Date();
      
      if (isAvailable !== undefined) {
        driverLocation.isAvailable = isAvailable;
      }
      
      await driverLocation.save();
    } else {
      // Create new location record
      driverLocation = await DriverLocation.create({
        driverId: req.user.id,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        lastUpdated: new Date()
      });
    }

    // Find active order assigned to this driver
    const activeOrder = await Order.findOne({
      where: {
        driverId: req.user.id,
        status: 'out_for_delivery'
      }
    });

    // If driver has an active order, emit location update to customer
    if (activeOrder) {
      emitToOrder(activeOrder.id, 'driver_location_updated', {
        orderId: activeOrder.id,
        location: {
          latitude,
          longitude,
          heading,
          speed,
          updatedAt: new Date().toISOString()
        }
      });
      
      // Also emit to customer
      emitToUser(activeOrder.userId, 'driver_location_updated', {
        orderId: activeOrder.id,
        location: {
          latitude,
          longitude,
          heading,
          speed,
          updatedAt: new Date().toISOString()
        }
      });
      
      // Update ETA if significant location change
      await updateOrderETA(activeOrder, { latitude, longitude });
    }

    res.status(200).json({
      status: 'success',
      data: {
        location: driverLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get driver location
 * @route GET /api/tracking/driver/:driverId
 * @access Private
 */
exports.getDriverLocation = async (req, res, next) => {
  try {
    const { driverId } = req.params;

    // Find driver
    const driver = await User.findOne({
      where: {
        id: driverId,
        role: 'driver'
      }
    });

    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    // Get driver location
    const location = await DriverLocation.findOne({
      where: { driverId },
      attributes: [
        'latitude', 
        'longitude', 
        'heading', 
        'speed', 
        'isAvailable', 
        'lastUpdated'
      ]
    });

    if (!location) {
      return next(new AppError('Driver location not available', 404));
    }

    // Check if location is stale (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (location.lastUpdated < fiveMinutesAgo) {
      return next(new AppError('Driver location is outdated', 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        location
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tracking info for an order
 * @route GET /api/tracking/order/:orderId
 * @access Private
 */
exports.getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'phone', 'profileImage']
        }
      ]
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Ensure user is authorized to view this order
    if (req.user.id !== order.userId && 
        req.user.id !== order.driverId && 
        req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to view this order', 403));
    }

    // Get status logs
    const { OrderStatusLog } = require('../models');
    const statusLogs = await OrderStatusLog.findAll({
      where: { orderId },
      order: [['createdAt', 'ASC']]
    });

    // Get driver location if order is out for delivery
    let driverLocation = null;
    if (order.status === 'out_for_delivery' && order.driverId) {
      driverLocation = await DriverLocation.findOne({
        where: { driverId: order.driverId },
        attributes: [
          'latitude',
          'longitude',
          'heading',
          'speed',
          'lastUpdated'
        ]
      });
    }

    // Calculate ETA based on driver location
    let estimatedArrival = order.estimatedDeliveryTime;
    if (driverLocation && order.status === 'out_for_delivery') {
      // Get updated ETA based on current location
      estimatedArrival = await calculateETA(order, driverLocation);
    }

    res.status(200).json({
      status: 'success',
      data: {
        order: {
          id: order.id,
          status: order.status,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          actualDeliveryTime: order.actualDeliveryTime,
          driver: order.driver,
          currentETA: estimatedArrival
        },
        statusLogs,
        driverLocation,
        deliveryAddress: order.deliveryAddress
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate ETA based on driver location and delivery address
 * @param {Object} order - Order object
 * @param {Object} driverLocation - Driver location object
 * @returns {Date} - Estimated delivery time
 */
const calculateETA = async (order, driverLocation) => {
  try {
    // This is a placeholder for actual distance/ETA calculation
    // In a real implementation, you would use Google Maps Distance Matrix API or similar
    
    // For now, use a simple calculation based on straight-line distance
    // and average speed of 30 km/h
    
    // Convert delivery address to coordinates (placeholder)
    // In reality, you would geocode the address or store coordinates when order is placed
    const deliveryCoords = await geocodeAddress(order.deliveryAddress);
    
    if (!deliveryCoords) {
      // If geocoding fails, return the original estimate
      return order.estimatedDeliveryTime;
    }
    
    // Calculate distance in kilometers using Haversine formula
    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    );
    
    // Estimate time: distance / average speed (30 km/h)
    const estimatedTimeHours = distance / 30;
    const estimatedTimeMs = estimatedTimeHours * 60 * 60 * 1000;
    
    // Add estimated time to current time
    return new Date(Date.now() + estimatedTimeMs);
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return order.estimatedDeliveryTime;
  }
};

/**
 * Update order ETA based on driver location
 * @param {Object} order - Order object
 * @param {Object} location - Driver location object
 */
const updateOrderETA = async (order, location) => {
  try {
    // Calculate new ETA
    const newETA = await calculateETA(order, location);
    
    // Only update if ETA has changed significantly (> 5 minutes)
    const etaDiffMs = Math.abs(newETA - order.estimatedDeliveryTime);
    if (etaDiffMs > 5 * 60 * 1000) {
      // Update order with new ETA
      order.estimatedDeliveryTime = newETA;
      await order.save();
      
      // Notify customer of updated ETA
      emitToUser(order.userId, 'eta_updated', {
        orderId: order.id,
        estimatedDeliveryTime: newETA.toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating order ETA:', error);
  }
};

/**
 * Geocode an address to get coordinates
 * This is a placeholder function - in production, use Google Maps Geocoding API
 * @param {string} address - Address to geocode
 * @returns {Object|null} - Coordinates or null if geocoding fails
 */
const geocodeAddress = async (address) => {
  try {
    // Placeholder - in reality, use Google Maps Geocoding API
    // For testing, return random coordinates near a predefined location
    return {
      latitude: 10.8231 + (Math.random() - 0.5) * 0.01,
      longitude: 106.6297 + (Math.random() - 0.5) * 0.01
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} - Radians
 */
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

module.exports = {
  updateDriverLocation,
  getDriverLocation,
  getOrderTracking
};