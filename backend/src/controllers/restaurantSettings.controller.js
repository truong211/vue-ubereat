const { Restaurant, RestaurantSettings } = require('../models');
const { AppError } = require('../middleware/error.middleware');

/**
 * Get restaurant settings
 * @route GET /api/restaurants/:id/settings
 * @access Private (Restaurant Owner)
 */
exports.getRestaurantSettings = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Get restaurant settings
    const settings = await RestaurantSettings.findOne({
      where: { restaurantId: id }
    });

    // Get restaurant details with settings fields
    const restaurantWithSettings = {
      ...restaurant.toJSON(),
      settings: settings ? settings.toJSON() : null
    };

    res.status(200).json({
      status: 'success',
      data: {
        settings: restaurantWithSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update operating hours
 * @route PATCH /api/restaurants/:id/operating-hours
 * @access Private (Restaurant Owner)
 */
exports.updateOperatingHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { openingHours } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Validate opening hours format
    if (openingHours) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      for (const day of days) {
        if (!openingHours[day]) {
          return next(new AppError(`Opening hours for ${day} is missing`, 400));
        }
        if (typeof openingHours[day].enabled !== 'boolean') {
          return next(new AppError(`'enabled' field for ${day} must be a boolean`, 400));
        }
        if (openingHours[day].enabled) {
          if (!openingHours[day].open || !openingHours[day].close) {
            return next(new AppError(`Open and close times are required for ${day}`, 400));
          }
        }
      }
    }

    // Update restaurant opening hours
    await restaurant.update({ openingHours });

    // Emit socket event for real-time updates (if applicable)
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`restaurant:${id}`).emit('opening_hours_updated', {
        restaurantId: id,
        openingHours
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        openingHours: restaurant.openingHours
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update special holidays
 * @route PATCH /api/restaurants/:id/special-holidays
 * @access Private (Restaurant Owner)
 */
exports.updateSpecialHolidays = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialHolidays } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Validate special holidays format
    if (specialHolidays && !Array.isArray(specialHolidays)) {
      return next(new AppError('Special holidays must be an array', 400));
    }

    // Update restaurant special holidays
    await restaurant.update({ specialHolidays });

    // Emit socket event for real-time updates (if applicable)
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`restaurant:${id}`).emit('special_holidays_updated', {
        restaurantId: id,
        specialHolidays
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        specialHolidays: restaurant.specialHolidays
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery settings
 * @route PATCH /api/restaurants/:id/delivery-settings
 * @access Private (Restaurant Owner)
 */
exports.updateDeliverySettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliverySettings } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Validate delivery settings
    if (deliverySettings) {
      if (deliverySettings.radius && (isNaN(deliverySettings.radius) || deliverySettings.radius <= 0)) {
        return next(new AppError('Delivery radius must be a positive number', 400));
      }
      if (deliverySettings.minOrder && (isNaN(deliverySettings.minOrder) || deliverySettings.minOrder < 0)) {
        return next(new AppError('Minimum order amount must be a non-negative number', 400));
      }
    }

    // Update restaurant delivery settings
    await restaurant.update({ deliverySettings });

    // Emit socket event for real-time updates (if applicable)
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`restaurant:${id}`).emit('delivery_settings_updated', {
        restaurantId: id,
        deliverySettings
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        deliverySettings: restaurant.deliverySettings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update menu availability
 * @route PATCH /api/restaurants/:id/menu-availability
 * @access Private (Restaurant Owner)
 */
exports.updateMenuAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { menuAvailability } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Validate menu availability
    if (menuAvailability && typeof menuAvailability.scheduleEnabled !== 'boolean') {
      return next(new AppError('scheduleEnabled must be a boolean', 400));
    }

    // Update restaurant menu availability
    await restaurant.update({ menuAvailability });

    // Emit socket event for real-time updates (if applicable)
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`restaurant:${id}`).emit('menu_availability_updated', {
        restaurantId: id,
        menuAvailability
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        menuAvailability: restaurant.menuAvailability
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update temporary closure settings
 * @route PATCH /api/restaurants/:id/temporary-closure
 * @access Private (Restaurant Owner)
 */
exports.updateTemporaryClosure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tempClosureSettings } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Validate temporary closure settings
    if (tempClosureSettings && typeof tempClosureSettings.isTemporarilyClosed !== 'boolean') {
      return next(new AppError('isTemporarilyClosed must be a boolean', 400));
    }

    // Update restaurant temporary closure settings
    await restaurant.update({ tempClosureSettings });

    // Update restaurant settings table for real-time availability
    const [settings, created] = await RestaurantSettings.findOrCreate({
      where: { restaurantId: id },
      defaults: {
        restaurantId: id,
        isOpen: !tempClosureSettings.isTemporarilyClosed,
        availabilityStatus: tempClosureSettings.isTemporarilyClosed ? 'temporarily_closed' : 'online',
        acceptingOrders: !tempClosureSettings.isTemporarilyClosed || tempClosureSettings.acceptPreOrders
      }
    });

    if (!created) {
      await settings.update({
        isOpen: !tempClosureSettings.isTemporarilyClosed,
        availabilityStatus: tempClosureSettings.isTemporarilyClosed ? 'temporarily_closed' : 'online',
        acceptingOrders: !tempClosureSettings.isTemporarilyClosed || tempClosureSettings.acceptPreOrders
      });
    }

    // Emit socket event for real-time updates (if applicable)
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(`restaurant:${id}`).emit('temporary_closure_updated', {
        restaurantId: id,
        tempClosureSettings,
        isOpen: !tempClosureSettings.isTemporarilyClosed,
        availabilityStatus: tempClosureSettings.isTemporarilyClosed ? 'temporarily_closed' : 'online',
        acceptingOrders: !tempClosureSettings.isTemporarilyClosed || tempClosureSettings.acceptPreOrders
      });
    }

    // Handle existing orders if restaurant is now closed
    if (tempClosureSettings.isTemporarilyClosed) {
      await handleExistingOrdersOnClosure(id, tempClosureSettings);
    }

    res.status(200).json({
      status: 'success',
      data: {
        tempClosureSettings: restaurant.tempClosureSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle existing orders when a restaurant closes temporarily
 * @private
 */
const handleExistingOrdersOnClosure = async (restaurantId, closureSettings) => {
  try {
    const { Order } = require('../models');
    const { Op } = require('sequelize');
    
    // Find pending and confirmed orders
    const pendingOrders = await Order.findAll({
      where: {
        restaurantId,
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });
    
    // Handle each order based on closure settings
    for (const order of pendingOrders) {
      if (!closureSettings.acceptPreOrders) {
        // Cancel the order if pre-orders are not accepted
        await order.update({
          status: 'cancelled',
          cancellationReason: 'Restaurant temporarily closed'
        });
        
        // Notify customer about cancellation via socket (if applicable)
        if (global.io) {
          global.io.to(`user:${order.userId}`).emit('order_cancelled', {
            orderId: order.id,
            reason: 'Restaurant temporarily closed'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling existing orders on closure:', error);
  }
};

/**
 * Update real-time availability status
 * @route PATCH /api/restaurants/:id/availability-status
 * @access Private (Restaurant Owner)
 */
exports.updateAvailabilityStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      isOpen, 
      availabilityStatus, 
      busyLevel, 
      estimatedPrepTime,
      statusMessage,
      acceptingOrders 
    } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Find or create restaurant settings
    const [settings, created] = await RestaurantSettings.findOrCreate({
      where: { restaurantId: id },
      defaults: {
        restaurantId: id,
        isOpen: isOpen !== undefined ? isOpen : true,
        availabilityStatus: availabilityStatus || 'online',
        busyLevel: busyLevel || null,
        estimatedPrepTime: estimatedPrepTime || null,
        statusMessage: statusMessage || null,
        acceptingOrders: acceptingOrders !== undefined ? acceptingOrders : true
      }
    });

    // Update settings if they already exist
    if (!created) {
      await settings.update({
        isOpen: isOpen !== undefined ? isOpen : settings.isOpen,
        availabilityStatus: availabilityStatus || settings.availabilityStatus,
        busyLevel: busyLevel !== undefined ? busyLevel : settings.busyLevel,
        estimatedPrepTime: estimatedPrepTime !== undefined ? estimatedPrepTime : settings.estimatedPrepTime,
        statusMessage: statusMessage !== undefined ? statusMessage : settings.statusMessage,
        acceptingOrders: acceptingOrders !== undefined ? acceptingOrders : settings.acceptingOrders
      });
    }

    // Emit socket event for real-time updates (if applicable)
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.emit('restaurant_availability_updated', {
        restaurantId: id,
        status: settings.availabilityStatus,
        isOpen: settings.isOpen,
        busyLevel: settings.busyLevel,
        estimatedPrepTime: settings.estimatedPrepTime,
        message: settings.statusMessage,
        acceptingOrders: settings.acceptingOrders,
        updatedAt: settings.updatedAt
      });
    }

    res.status(200).json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};