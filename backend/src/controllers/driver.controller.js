// filepath: d:\vue-ubereat\backend\src\controllers\driver.controller.js
const { validationResult } = require('express-validator');
const { User, Order, DriverLocation, DriverStatus, Vehicle } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const NotificationService = require('../services/notification.service');
const socketService = require('../services/socket.service');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Get all active drivers
 * @route GET /api/drivers
 * @access Private (Admin/Restaurant Owner)
 */
exports.getAllDrivers = async (req, res, next) => {
  try {
    const { status, location } = req.query;
    
    // Build filter based on query parameters
    const filter = { role: 'driver' };
    
    if (status) {
      filter.status = status;
    }
    
    // Get drivers with their current status and location
    const drivers = await User.findAll({
      where: filter,
      attributes: ['id', 'fullName', 'phone', 'email', 'profileImage', 'createdAt', 'status'],
      include: [
        {
          model: DriverStatus,
          as: 'driverStatus',
          attributes: ['status', 'isActive', 'updatedAt']
        },
        {
          model: DriverLocation,
          as: 'location',
          attributes: ['latitude', 'longitude', 'updatedAt']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['type', 'model', 'licensePlate', 'color']
        }
      ]
    });
    
    // Filter by location if provided (e.g., within X km radius)
    let filteredDrivers = drivers;
    if (location) {
      const { latitude, longitude, radius = 10 } = JSON.parse(location);
      filteredDrivers = drivers.filter(driver => {
        // Only include drivers with location data
        if (!driver.location) return false;
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          latitude, 
          longitude, 
          driver.location.latitude, 
          driver.location.longitude
        );
        
        // Add distance to driver object for sorting
        driver.distance = distance;
        
        // Filter based on radius
        return distance <= radius;
      });
      
      // Sort by distance
      filteredDrivers.sort((a, b) => a.distance - b.distance);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        drivers: filteredDrivers
      }
    });
  } catch (error) {
    logger.error('Error fetching drivers:', error);
    next(error);
  }
};

/**
 * Get driver profile
 * @route GET /api/drivers/:id
 * @access Private (Admin/Restaurant Owner/Self)
 */
exports.getDriverProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if requesting user is the driver, an admin, or a restaurant owner
    const isAuthorized = 
      req.user.id === parseInt(id) || 
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return next(new AppError('You are not authorized to access this driver profile', 403));
    }
    
    const driver = await User.findOne({
      where: { id, role: 'driver' },
      attributes: ['id', 'fullName', 'phone', 'email', 'profileImage', 'createdAt', 'status'],
      include: [
        {
          model: DriverStatus,
          as: 'driverStatus',
          attributes: ['status', 'isActive', 'updatedAt']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['type', 'model', 'licensePlate', 'color']
        }
      ]
    });
    
    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }
    
    // Get delivery statistics
    const stats = await db.query(`
      SELECT 
        COUNT(*) AS totalDeliveries,
        AVG(TIMESTAMPDIFF(MINUTE, preparationEndTime, actualDeliveryTime)) AS avgDeliveryTime,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) / COUNT(*) * 100 AS completionRate
      FROM orders
      WHERE driverId = ?
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        driver,
        stats: stats[0] || { totalDeliveries: 0, avgDeliveryTime: 0, completionRate: 0 }
      }
    });
  } catch (error) {
    logger.error('Error fetching driver profile:', error);
    next(error);
  }
};

/**
 * Update driver status
 * @route PATCH /api/drivers/:id/status
 * @access Private (Self/Admin)
 */
exports.updateDriverStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;
    
    // Check if requesting user is the driver or an admin
    const isAuthorized = 
      req.user.id === parseInt(id) || 
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return next(new AppError('You are not authorized to update this driver status', 403));
    }
    
    // Validate the driver exists
    const driver = await User.findOne({
      where: { id, role: 'driver' }
    });
    
    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }
    
    // Update or create driver status
    let driverStatus = await DriverStatus.findOne({
      where: { driverId: id }
    });
    
    if (driverStatus) {
      await driverStatus.update({
        status: status || driverStatus.status,
        isActive: isActive !== undefined ? isActive : driverStatus.isActive,
        updatedAt: new Date()
      });
    } else {
      driverStatus = await DriverStatus.create({
        driverId: id,
        status: status || 'available',
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date()
      });
    }
    
    // Emit status update via socket
    socketService.emitToAll('driver_status_updated', {
      driverId: id,
      status: driverStatus.status,
      isActive: driverStatus.isActive
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        driverStatus
      }
    });
  } catch (error) {
    logger.error('Error updating driver status:', error);
    next(error);
  }
};

/**
 * Update driver location
 * @route PATCH /api/drivers/:id/location
 * @access Private (Self)
 */
exports.updateDriverLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    // Check if requesting user is the driver
    if (req.user.id !== parseInt(id)) {
      return next(new AppError('You can only update your own location', 403));
    }
    
    // Validate required fields
    if (!latitude || !longitude) {
      return next(new AppError('Latitude and longitude are required', 400));
    }
    
    // Update or create driver location
    let driverLocation = await DriverLocation.findOne({
      where: { driverId: id }
    });
    
    if (driverLocation) {
      await driverLocation.update({
        latitude,
        longitude,
        updatedAt: new Date()
      });
    } else {
      driverLocation = await DriverLocation.create({
        driverId: id,
        latitude,
        longitude,
        updatedAt: new Date()
      });
    }
    
    // Find any active delivery for this driver
    const activeDelivery = await Order.findOne({
      where: {
        driverId: id,
        status: 'out_for_delivery'
      }
    });
    
    // If driver has an active delivery, send real-time location update
    if (activeDelivery) {
      // Emit location update via socket for order tracking
      await NotificationService.sendDriverLocationUpdate(activeDelivery, driverLocation);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        location: driverLocation
      }
    });
  } catch (error) {
    logger.error('Error updating driver location:', error);
    next(error);
  }
};

/**
 * Get active orders for driver
 * @route GET /api/drivers/:id/orders
 * @access Private (Self/Admin)
 */
exports.getDriverOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    // Check if requesting user is the driver or an admin
    const isAuthorized = 
      req.user.id === parseInt(id) || 
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return next(new AppError('You are not authorized to view these orders', 403));
    }
    
    // Build filter
    const filter = { driverId: id };
    
    if (status) {
      filter.status = status;
    } else {
      // If no status specified, show active orders
      filter.status = {
        [db.Sequelize.Op.in]: ['confirmed', 'ready', 'out_for_delivery']
      };
    }
    
    // Get orders
    const orders = await Order.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'phone']
        },
        {
          model: db.models.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'phone', 'latitude', 'longitude']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        orders
      }
    });
  } catch (error) {
    logger.error('Error fetching driver orders:', error);
    next(error);
  }
};

/**
 * Register vehicle
 * @route POST /api/drivers/:id/vehicle
 * @access Private (Self/Admin)
 */
exports.registerVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { type, model, licensePlate, color } = req.body;
    
    // Check if requesting user is the driver or an admin
    const isAuthorized = 
      req.user.id === parseInt(id) || 
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return next(new AppError('You are not authorized to register a vehicle for this driver', 403));
    }
    
    // Validate the driver exists
    const driver = await User.findOne({
      where: { id, role: 'driver' }
    });
    
    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }
    
    // Create or update vehicle
    let vehicle = await Vehicle.findOne({
      where: { driverId: id }
    });
    
    if (vehicle) {
      await vehicle.update({
        type,
        model,
        licensePlate,
        color
      });
    } else {
      vehicle = await Vehicle.create({
        driverId: id,
        type,
        model,
        licensePlate,
        color
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    logger.error('Error registering vehicle:', error);
    next(error);
  }
};

/**
 * Get nearby drivers for a restaurant
 * @route GET /api/drivers/nearby
 * @access Private (Restaurant Owner/Admin)
 */
exports.getNearbyDrivers = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    // Validate required fields
    if (!latitude || !longitude) {
      return next(new AppError('Latitude and longitude are required', 400));
    }
    
    // Get active drivers
    const drivers = await User.findAll({
      where: { role: 'driver' },
      attributes: ['id', 'fullName', 'phone', 'profileImage', 'status'],
      include: [
        {
          model: DriverStatus,
          as: 'driverStatus',
          where: { isActive: true, status: 'available' },
          required: true
        },
        {
          model: DriverLocation,
          as: 'location',
          required: true
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['type', 'model', 'licensePlate', 'color']
        }
      ]
    });
    
    // Calculate distance and filter by radius
    const nearbyDrivers = drivers
      .map(driver => {
        const distance = calculateDistance(
          latitude,
          longitude,
          driver.location.latitude,
          driver.location.longitude
        );
        
        return {
          ...driver.toJSON(),
          distance
        };
      })
      .filter(driver => driver.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    res.status(200).json({
      status: 'success',
      data: {
        drivers: nearbyDrivers
      }
    });
  } catch (error) {
    logger.error('Error fetching nearby drivers:', error);
    next(error);
  }
};

/**
 * Assign driver to order
 * @route POST /api/drivers/assign
 * @access Private (Restaurant Owner/Admin)
 */
exports.assignDriverToOrder = async (req, res, next) => {
  try {
    const { orderId, driverId } = req.body;
    
    // Get the order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: db.models.Restaurant,
          as: 'restaurant'
        }
      ]
    });
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }
    
    // Check if requesting user is authorized (restaurant owner or admin)
    const isAuthorized = 
      (req.user.role === 'restaurant' && req.user.id === order.restaurant.ownerId) ||
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return next(new AppError('You are not authorized to assign drivers for this order', 403));
    }
    
    // Get the driver
    const driver = await User.findOne({
      where: { id: driverId, role: 'driver' },
      include: [
        {
          model: DriverStatus,
          as: 'driverStatus'
        }
      ]
    });
    
    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }
    
    // Check if driver is available
    if (!driver.driverStatus || driver.driverStatus.status !== 'available' || !driver.driverStatus.isActive) {
      return next(new AppError('Driver is not available', 400));
    }
    
    // Update order with driver
    await order.update({
      driverId,
      driverAssignedAt: new Date()
    });
    
    // Update driver status to 'assigned'
    await driver.driverStatus.update({
      status: 'assigned'
    });
    
    // Notify driver via socket and notification
    const notificationResult = await NotificationService.createDriverAssignmentNotification(
      order, 
      driver
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          driver: {
            id: driver.id,
            name: driver.fullName,
            phone: driver.phone,
            profileImage: driver.profileImage
          }
        }
      }
    });
  } catch (error) {
    logger.error('Error assigning driver to order:', error);
    next(error);
  }
};

/**
 * Accept or reject order assignment
 * @route PATCH /api/drivers/:id/orders/:orderId
 * @access Private (Self)
 */
exports.respondToOrderAssignment = async (req, res, next) => {
  try {
    const { id, orderId } = req.params;
    const { accept } = req.body;
    
    // Check if requesting user is the driver
    if (req.user.id !== parseInt(id)) {
      return next(new AppError('You can only respond to your own assignments', 403));
    }
    
    // Get the order
    const order = await Order.findOne({
      where: { id: orderId, driverId: id },
      include: [
        {
          model: db.models.Restaurant,
          as: 'restaurant'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'phone']
        }
      ]
    });
    
    if (!order) {
      return next(new AppError('Order not found or not assigned to you', 404));
    }
    
    // Handle acceptance or rejection
    if (accept) {
      // Update driver status to 'on_delivery'
      await DriverStatus.update(
        { status: 'on_delivery' },
        { where: { driverId: id } }
      );
      
      // Notify restaurant and customer about acceptance
      socketService.emitToRoom(`restaurant:${order.restaurantId}`, 'driver_accepted_order', {
        orderId,
        driverId: id,
        driverName: req.user.fullName,
        driverPhone: req.user.phone
      });
      
      socketService.emitToRoom(`order:${orderId}`, 'driver_accepted_order', {
        orderId,
        driverId: id,
        driverName: req.user.fullName,
        driverPhone: req.user.phone
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Order assignment accepted',
          order
        }
      });
    } else {
      // Reset driver assignment
      await order.update({
        driverId: null,
        driverAssignedAt: null
      });
      
      // Update driver status back to 'available'
      await DriverStatus.update(
        { status: 'available' },
        { where: { driverId: id } }
      );
      
      // Notify restaurant about rejection
      socketService.emitToRoom(`restaurant:${order.restaurantId}`, 'driver_rejected_order', {
        orderId,
        driverId: id
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Order assignment rejected'
        }
      });
    }
  } catch (error) {
    logger.error('Error responding to order assignment:', error);
    next(error);
  }
};

/**
 * Get driver earnings report
 * @route GET /api/drivers/:id/earnings
 * @access Private (Self/Admin)
 */
exports.getDriverEarnings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if requesting user is the driver or an admin
    const isAuthorized = 
      req.user.id === parseInt(id) || 
      req.user.role === 'admin';
    
    if (!isAuthorized) {
      return next(new AppError('You are not authorized to view these earnings', 403));
    }
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Get completed orders for this driver
    const orders = await Order.findAll({
      where: {
        driverId: id,
        status: 'delivered',
        ...dateFilter
      },
      attributes: [
        'id', 'orderNumber', 'totalAmount', 'deliveryFee', 
        'createdAt', 'actualDeliveryTime'
      ]
    });
    
    // Calculate earnings (in a real app this would be based on your fee structure)
    // Here we'll use a simple model where driver gets 80% of the delivery fee
    const earnings = orders.reduce((total, order) => {
      const driverFee = order.deliveryFee * 0.8; // 80% of delivery fee
      return total + driverFee;
    }, 0);
    
    // Summarize by day
    const dailyEarnings = orders.reduce((result, order) => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const driverFee = order.deliveryFee * 0.8;
      
      if (!result[orderDate]) {
        result[orderDate] = {
          date: orderDate,
          earnings: 0,
          deliveries: 0
        };
      }
      
      result[orderDate].earnings += driverFee;
      result[orderDate].deliveries += 1;
      
      return result;
    }, {});
    
    res.status(200).json({
      status: 'success',
      data: {
        totalEarnings: earnings,
        totalDeliveries: orders.length,
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          date: order.createdAt,
          deliveryFee: order.deliveryFee,
          driverEarnings: order.deliveryFee * 0.8
        })),
        summary: Object.values(dailyEarnings).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        )
      }
    });
  } catch (error) {
    logger.error('Error fetching driver earnings:', error);
    next(error);
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - First latitude
 * @param {Number} lon1 - First longitude
 * @param {Number} lat2 - Second latitude
 * @param {Number} lon2 - Second longitude
 * @returns {Number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};