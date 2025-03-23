const { DriverLocation, Order, Notification, User } = require('../models');
const { emitToUser, emitToOrder } = require('../socket/handlers');
const { calculateDistance, estimateArrivalTime } = require('../utils/geoUtils');

// In-memory tracking data store
const activeTrackingSessions = new Map();

/**
 * Start tracking an order
 * @param {string} orderId - Order ID
 * @param {object} user - User object
 * @returns {object} - Tracking data
 */
exports.startTracking = async (orderId, user) => {
  try {
    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Validate user owns the order
    if (order.userId !== user.id) {
      throw new Error('Bạn không có quyền truy cập đơn hàng này');
    }

    // Get driver location if order has a driver
    let driverLocation = null;
    if (order.driverId) {
      driverLocation = await DriverLocation.findOne({
        where: { driverId: order.driverId },
        order: [['createdAt', 'DESC']]
      });
    }

    // Create tracking session data
    const trackingData = {
      orderId,
      userId: user.id,
      status: order.status,
      startedAt: new Date(),
      lastUpdated: new Date(),
      driverLocation: driverLocation ? {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
        heading: driverLocation.heading,
        speed: driverLocation.speed,
        updatedAt: driverLocation.createdAt
      } : null,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      statusHistory: [{
        status: order.status,
        timestamp: new Date()
      }]
    };

    // Store in memory
    activeTrackingSessions.set(orderId, trackingData);

    // Add user to tracking socket room
    // This would normally be handled by socket connection logic
    
    return trackingData;
  } catch (error) {
    console.error('Error starting tracking:', error);
    throw error;
  }
};

/**
 * Stop tracking an order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {boolean} - Success
 */
exports.stopTracking = (orderId, userId) => {
  try {
    // Get tracking session
    const trackingSession = activeTrackingSessions.get(orderId);
    if (!trackingSession) {
      return false;
    }

    // Validate user owns the tracking session
    if (trackingSession.userId !== userId) {
      return false;
    }

    // Remove tracking session
    activeTrackingSessions.delete(orderId);
    
    // Remove user from tracking socket room
    // This would normally be handled by socket disconnection logic

    return true;
  } catch (error) {
    console.error('Error stopping tracking:', error);
    return false;
  }
};

/**
 * Get tracking data for an order
 * @param {string} orderId - Order ID
 * @returns {object|null} - Tracking data or null if not tracking
 */
exports.getTrackingData = (orderId) => {
  return activeTrackingSessions.get(orderId) || null;
};

/**
 * Update driver location
 * @param {string} driverId - Driver ID
 * @param {object} location - Location data
 * @returns {boolean} - Success
 */
exports.updateDriverLocation = async (driverId, location) => {
  try {
    // Update driver location in database
    await DriverLocation.create({
      driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading || 0,
      speed: location.speed || 0,
      accuracy: location.accuracy || 0,
      createdAt: new Date()
    });

    // Find active orders assigned to this driver
    const activeOrders = await Order.findAll({
      where: {
        driverId,
        status: 'out_for_delivery'
      }
    });

    // Update tracking data for each order
    for (const order of activeOrders) {
      // Get tracking session
      const trackingSession = activeTrackingSessions.get(order.id);
      if (trackingSession) {
        // Update driver location
        trackingSession.driverLocation = {
          lat: location.latitude,
          lng: location.longitude,
          heading: location.heading || 0,
          speed: location.speed || 0,
          updatedAt: new Date()
        };
        trackingSession.lastUpdated = new Date();

        // Update ETA based on new location
        const updatedETA = await updateETA(order, location);
        if (updatedETA) {
          trackingSession.estimatedDeliveryTime = updatedETA;
          
          // Emit ETA update to customer
          emitToUser(order.userId, 'eta_updated', {
            orderId: order.id,
            estimatedDeliveryTime: updatedETA
          });
          
          // Create notification for significant ETA changes
          createETANotification(order, updatedETA);
        }

        // Emit location update
        emitToOrder(order.id, 'driver_location_updated', {
          orderId: order.id,
          location: trackingSession.driverLocation
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating driver location:', error);
    return false;
  }
};

/**
 * Get driver's current location
 * @param {string} driverId - Driver ID
 * @returns {object|null} - Location data or null if not found
 */
exports.getDriverLocation = async (driverId) => {
  try {
    const location = await DriverLocation.findOne({
      where: { driverId },
      order: [['createdAt', 'DESC']]
    });

    if (!location) {
      return null;
    }

    return {
      lat: location.latitude,
      lng: location.longitude,
      heading: location.heading,
      speed: location.speed,
      updatedAt: location.createdAt
    };
  } catch (error) {
    console.error('Error getting driver location:', error);
    return null;
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {boolean} - Success
 */
exports.updateOrderStatus = async (orderId, status) => {
  try {
    // Get tracking session
    const trackingSession = activeTrackingSessions.get(orderId);
    if (!trackingSession) {
      return false;
    }

    // Update status
    trackingSession.status = status;
    trackingSession.lastUpdated = new Date();
    
    // Add to status history
    trackingSession.statusHistory.push({
      status,
      timestamp: new Date()
    });

    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      return false;
    }

    // Create notification about status change
    await createStatusNotification(order, status);

    // Emit status update
    emitToOrder(orderId, 'order_status_updated', {
      orderId,
      status,
      timestamp: new Date()
    });

    // For "delivered" status, calculate actual delivery time
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      await order.save();
    }

    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
};

/**
 * Update estimated time of arrival (ETA)
 * @param {object} order - Order object
 * @param {object} location - Driver location
 * @returns {Date|null} - Updated ETA or null if not changed
 */
const updateETA = async (order, location) => {
  try {
    // Get delivery address location
    // This would normally involve geocoding or retrieving stored coordinates
    const deliveryCoordinates = await getDeliveryCoordinates(order);
    if (!deliveryCoordinates) {
      return null;
    }

    // Calculate distance between driver and delivery location
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      deliveryCoordinates.latitude,
      deliveryCoordinates.longitude
    );

    // Estimate arrival time based on distance and current speed
    const eta = estimateArrivalTime(distance, location.speed || 30);
    
    // Check if ETA changed significantly (more than 5 minutes)
    const currentETA = order.estimatedDeliveryTime;
    const etaDiffMinutes = Math.abs(eta - currentETA) / (1000 * 60);
    
    if (etaDiffMinutes > 5) {
      // Update order's ETA in database
      order.estimatedDeliveryTime = eta;
      await order.save();
      return eta;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating ETA:', error);
    return null;
  }
};

/**
 * Get delivery address coordinates
 * This is a placeholder - in a real implementation, you would either:
 * 1. Retrieve stored coordinates from the order
 * 2. Geocode the address using a service like Google Maps
 * @param {object} order - Order object
 * @returns {object|null} - Coordinates or null if not available
 */
const getDeliveryCoordinates = async (order) => {
  try {
    // Placeholder implementation - would be replaced with actual geocoding or database lookup
    return {
      latitude: 10.8231, // Example coordinates for Ho Chi Minh City
      longitude: 106.6297
    };
  } catch (error) {
    console.error('Error getting delivery coordinates:', error);
    return null;
  }
};

/**
 * Create notification for order status change
 * @param {object} order - Order object
 * @param {string} status - New status
 */
const createStatusNotification = async (order, status) => {
  try {
    // Get status message in Vietnamese
    const statusMessages = {
      'pending': 'Đơn hàng của bạn đã được đặt thành công',
      'confirmed': 'Đơn hàng của bạn đã được xác nhận',
      'preparing': 'Nhà hàng đang chuẩn bị đơn hàng của bạn',
      'ready_for_pickup': 'Đơn hàng của bạn đã sẵn sàng để giao',
      'out_for_delivery': 'Tài xế đang giao đơn hàng của bạn',
      'delivered': 'Đơn hàng của bạn đã được giao thành công',
      'cancelled': 'Đơn hàng của bạn đã bị hủy'
    };

    const message = statusMessages[status] || `Trạng thái đơn hàng đã thay đổi thành ${status}`;
    
    // Create notification
    await Notification.create({
      userId: order.userId,
      type: 'ORDER_STATUS',
      title: 'Cập nhật trạng thái đơn hàng',
      message,
      data: {
        orderId: order.id,
        status,
        timestamp: new Date()
      }
    });

    // Emit notification to user
    emitToUser(order.userId, 'notification', {
      type: 'ORDER_STATUS',
      title: 'Cập nhật trạng thái đơn hàng',
      message,
      orderId: order.id,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error creating status notification:', error);
  }
};

/**
 * Create notification for ETA update
 * @param {object} order - Order object
 * @param {Date} newETA - New estimated delivery time
 */
const createETANotification = async (order, newETA) => {
  try {
    // Format ETA for display
    const etaTime = new Date(newETA).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const message = `Thời gian giao hàng dự kiến đã được cập nhật. Đơn hàng của bạn sẽ được giao vào khoảng ${etaTime}`;
    
    // Create notification
    await Notification.create({
      userId: order.userId,
      type: 'ETA_UPDATE',
      title: 'Cập nhật thời gian giao hàng',
      message,
      data: {
        orderId: order.id,
        estimatedDeliveryTime: newETA,
        timestamp: new Date()
      }
    });

    // Emit notification to user
    emitToUser(order.userId, 'notification', {
      type: 'ETA_UPDATE',
      title: 'Cập nhật thời gian giao hàng',
      message,
      orderId: order.id,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error creating ETA notification:', error);
  }
};