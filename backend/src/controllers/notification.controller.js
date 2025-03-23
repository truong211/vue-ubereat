const { Notification, User, Order, Driver, Restaurant } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const webpush = require('web-push');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const socketService = require('../services/socket.service');

// Configure web push
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BLBx-hf5h16ZxeKVJ-n7NCdXIWc8dCJ8CQeduYrz5YLXJvoVbqBQUMUJRR9y1YzKwDG6cGM-HzeAMiGrsACFsQ8',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'TvwzfBx-tSoB753grR0JfbevvYbj-DTYp-qP1e-vqAo'
};

webpush.setVapidDetails(
  'mailto:support@vuejsubereat.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Subscribe to push notifications
 * @route POST /api/notifications/subscribe
 * @access Private
 */
exports.subscribe = async (req, res, next) => {
  try {
    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint) {
      return next(new AppError('Invalid subscription object', 400));
    }

    // Create or update the notification subscription
    const [notificationSub, created] = await Notification.findOrCreate({
      where: {
        endpoint: subscription.endpoint,
        userId: req.user.id
      },
      defaults: {
        userId: req.user.id,
        subscription: JSON.stringify(subscription),
        userAgent: userAgent || req.headers['user-agent'],
        active: true
      }
    });

    if (!created) {
      await notificationSub.update({
        subscription: JSON.stringify(subscription),
        userAgent: userAgent || req.headers['user-agent'],
        active: true
      });
    }

    // Send a test notification to confirm subscription
    if (created) {
      const payload = JSON.stringify({
        title: 'Notifications Enabled',
        message: 'You will now receive updates about your orders and promotions',
        icon: '/img/icons/notification-icon.png',
        badge: '/img/icons/badge-icon.png',
        type: 'system',
        data: {
          url: '/profile/notifications'
        }
      });

      // Send notification asynchronously
      setTimeout(() => {
        webpush.sendNotification(subscription, payload)
          .catch(error => console.error('Error sending test notification:', error));
      }, 2000);
    }

    res.status(201).json({
      status: 'success',
      data: {
        message: 'Successfully subscribed to notifications'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsubscribe from push notifications
 * @route POST /api/notifications/unsubscribe
 * @access Private
 */
exports.unsubscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return next(new AppError('Invalid subscription object', 400));
    }

    // Find and update the notification subscription
    const notificationSub = await Notification.findOne({
      where: {
        endpoint: subscription.endpoint,
        userId: req.user.id
      }
    });

    if (!notificationSub) {
      return next(new AppError('Subscription not found', 404));
    }

    // Mark as inactive (soft delete)
    await notificationSub.update({
      active: false
    });

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Successfully unsubscribed from notifications'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's notification preferences
 * @route GET /api/notifications/preferences
 * @access Private
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get notification preferences
    const preferences = user.notificationPreferences || {
      orderUpdates: true,
      promotions: true,
      driverLocation: true,
      marketing: false,
      email: true,
      push: true,
      sms: user.phoneVerified || false
    };

    res.status(200).json({
      status: 'success',
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's notification preferences
 * @route PUT /api/notifications/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const preferences = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update notification preferences
    await user.update({
      notificationPreferences: {
        ...user.notificationPreferences,
        ...preferences
      }
    });

    res.status(200).json({
      status: 'success',
      data: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's notifications
 * @route GET /api/notifications
 * @access Private
 */
exports.getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50
  });

  res.status(200).json({
    status: 'success',
    data: {
      notifications
    }
  });
});

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!notification) {
    return next(new AppError('Thông báo không tồn tại', 404));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: req.user.id, isRead: false } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Đã đánh dấu tất cả thông báo là đã đọc'
  });
});

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send order status notification
 * @param {Object} order - Order object
 * @param {string} status - Order status
 * @param {Object} additionalData - Additional data for the notification
 */
exports.sendOrderStatusNotification = async (order, status, additionalData = {}) => {
  try {
    // Get user and check preferences
    const user = await User.findByPk(order.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has notification preferences for order updates
    const preferences = user.notificationPreferences || {};
    
    if (preferences.orderUpdates === false) {
      // User has disabled order notifications
      return;
    }

    // Get notification subscriptions
    const subscriptions = await Notification.findAll({
      where: {
        userId: user.id,
        active: true
      }
    });

    if (subscriptions.length === 0) {
      // No active subscriptions
      return;
    }

    // Get status message
    let title, message;
    
    switch (status) {
      case 'confirmed':
        title = 'Order Confirmed';
        message = `Your order #${order.orderNumber} has been confirmed by the restaurant.`;
        break;
      case 'preparing':
        title = 'Order in Preparation';
        message = `The restaurant is now preparing your order #${order.orderNumber}.`;
        break;
      case 'ready':
        title = 'Order Ready for Pickup';
        message = `Your order #${order.orderNumber} is ready for pickup by the driver.`;
        break;
      case 'picked_up':
        title = 'Order Picked Up';
        message = `Your order #${order.orderNumber} has been picked up by the driver.`;
        break;
      case 'on_the_way':
        title = 'Order On the Way';
        message = `Your order #${order.orderNumber} is on the way to you.`;
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = `Your order #${order.orderNumber} has been delivered.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${order.orderNumber} has been cancelled.`;
        break;
      default:
        title = 'Order Update';
        message = `Your order #${order.orderNumber} status has been updated to ${status}.`;
    }

    // Create notification payload
    const payload = JSON.stringify({
      title,
      message,
      icon: '/img/icons/notification-icon.png',
      badge: '/img/icons/badge-icon.png',
      type: 'order_status',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
        ...additionalData
      }
    });

    // Send notifications
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          JSON.parse(subscription.subscription),
          payload
        );
      } catch (error) {
        console.error('Error sending notification:', error);
        
        // If subscription is expired or invalid, mark as inactive
        if (error.statusCode === 410) {
          await subscription.update({ active: false });
        }
      }
    }

    // Also create in-app notification
    await Notification.create({
      userId: user.id,
      title,
      message,
      type: 'order_status',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
        ...additionalData
      },
      read: false
    });

  } catch (error) {
    console.error('Error sending order status notification:', error);
  }
};

/**
 * Send driver location update notification
 * @param {Object} order - Order object
 * @param {Object} location - Location object
 * @param {number} eta - Estimated time of arrival in minutes
 */
exports.sendDriverLocationNotification = async (order, location, eta) => {
  try {
    // Get user and check preferences
    const user = await User.findByPk(order.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has notification preferences for driver location updates
    const preferences = user.notificationPreferences || {};
    
    if (preferences.driverLocation === false) {
      // User has disabled driver location notifications
      return;
    }

    // Get notification subscriptions
    const subscriptions = await Notification.findAll({
      where: {
        userId: user.id,
        active: true
      }
    });

    if (subscriptions.length === 0) {
      // No active subscriptions
      return;
    }

    // Get driver information
    const driver = await Driver.findByPk(order.driverId);
    
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Create notification title and message
    const title = 'Driver Update';
    const message = `Your order #${order.orderNumber} will arrive in approximately ${eta} minutes.`;

    // Create notification payload
    const payload = JSON.stringify({
      title,
      message,
      icon: '/img/icons/driver-icon.png',
      badge: '/img/icons/badge-icon.png',
      type: 'driver_location',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        driverId: driver.id,
        driverName: driver.fullName,
        location,
        eta
      }
    });

    // Send notifications
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          JSON.parse(subscription.subscription),
          payload
        );
      } catch (error) {
        console.error('Error sending notification:', error);
        
        // If subscription is expired or invalid, mark as inactive
        if (error.statusCode === 410) {
          await subscription.update({ active: false });
        }
      }
    }

    // Also create in-app notification
    await Notification.create({
      userId: user.id,
      title,
      message,
      type: 'driver_location',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        driverId: driver.id,
        driverName: driver.fullName,
        location,
        eta
      },
      read: false
    });

  } catch (error) {
    console.error('Error sending driver location notification:', error);
  }
};

/**
 * Send promotion notification
 * @param {Object} promotion - Promotion object
 * @param {Array} userIds - Array of user IDs to send notification to
 */
exports.sendPromotionNotification = async (promotion, userIds = null) => {
  try {
    // If no specific users, get all users who opted in to promotions
    const users = userIds ? 
      await User.findAll({ where: { id: userIds } }) : 
      await User.findAll({
        where: {
          notificationPreferences: {
            promotions: true
          }
        }
      });

    for (const user of users) {
      // Get notification subscriptions
      const subscriptions = await Notification.findAll({
        where: {
          userId: user.id,
          active: true
        }
      });

      if (subscriptions.length === 0) {
        // No active subscriptions, skip
        continue;
      }

      // Get restaurant information if available
      let restaurantName = '';
      if (promotion.restaurantId) {
        const restaurant = await Restaurant.findByPk(promotion.restaurantId);
        restaurantName = restaurant ? restaurant.name : '';
      }

      // Create notification title and message
      const title = promotion.title || 'Special Offer';
      const message = restaurantName ? 
        `${restaurantName}: ${promotion.description}` : 
        promotion.description;

      // Create notification payload
      const payload = JSON.stringify({
        title,
        message,
        icon: promotion.image || '/img/icons/promotion-icon.png',
        badge: '/img/icons/badge-icon.png',
        type: 'promotion',
        data: {
          promotionId: promotion.id,
          restaurantId: promotion.restaurantId,
          url: `/promotions/${promotion.id}`,
          validUntil: promotion.endDate
        }
      });

      // Send notifications
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            JSON.parse(subscription.subscription),
            payload
          );
        } catch (error) {
          console.error('Error sending notification:', error);
          
          // If subscription is expired or invalid, mark as inactive
          if (error.statusCode === 410) {
            await subscription.update({ active: false });
          }
        }
      }

      // Also create in-app notification
      await Notification.create({
        userId: user.id,
        title,
        message,
        type: 'promotion',
        data: {
          promotionId: promotion.id,
          restaurantId: promotion.restaurantId,
          validUntil: promotion.endDate
        },
        read: false
      });
    }
  } catch (error) {
    console.error('Error sending promotion notification:', error);
  }
};

/**
 * Send custom marketing message
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data for the notification
 * @param {Array} userIds - Array of user IDs to send notification to
 */
exports.sendMarketingNotification = async (title, message, data = {}, userIds = null) => {
  try {
    // If no specific users, get all users who opted in to marketing
    const users = userIds ? 
      await User.findAll({ where: { id: userIds } }) : 
      await User.findAll({
        where: {
          notificationPreferences: {
            marketing: true
          }
        }
      });

    for (const user of users) {
      // Get notification subscriptions
      const subscriptions = await Notification.findAll({
        where: {
          userId: user.id,
          active: true
        }
      });

      if (subscriptions.length === 0) {
        // No active subscriptions, skip
        continue;
      }

      // Create notification payload
      const payload = JSON.stringify({
        title,
        message,
        icon: data.icon || '/img/icons/marketing-icon.png',
        badge: '/img/icons/badge-icon.png',
        type: 'marketing',
        data: {
          url: data.url || '/',
          ...data
        }
      });

      // Send notifications
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            JSON.parse(subscription.subscription),
            payload
          );
        } catch (error) {
          console.error('Error sending notification:', error);
          
          // If subscription is expired or invalid, mark as inactive
          if (error.statusCode === 410) {
            await subscription.update({ active: false });
          }
        }
      }

      // Also create in-app notification
      await Notification.create({
        userId: user.id,
        title,
        message,
        type: 'marketing',
        data,
        read: false
      });
    }
  } catch (error) {
    console.error('Error sending marketing notification:', error);
  }
};

/**
 * Get notification counts
 * @route GET /api/notifications/counts
 * @access Private
 */
exports.getNotificationCounts = async (req, res, next) => {
  try {
    // Count total unread notifications
    const unreadCount = await Notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    // Count by type
    const counts = {
      total: unreadCount,
      order_status: 0,
      driver_location: 0,
      promotion: 0,
      marketing: 0,
      system: 0
    };

    // Get counts by type
    const typeCounts = await Notification.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        userId: req.user.id,
        read: false
      },
      group: ['type']
    });

    // Update counts
    typeCounts.forEach(typeCount => {
      const type = typeCount.type;
      counts[type] = parseInt(typeCount.getDataValue('count'));
    });

    res.status(200).json({
      status: 'success',
      data: counts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a notification for order status change
 * @param {Object} options - Notification options
 * @param {string} options.orderId - Order ID
 * @param {string} options.userId - User ID
 * @param {string} options.status - New order status
 * @param {Object} options.data - Additional data
 */
exports.createOrderStatusNotification = async (options) => {
  try {
    const { orderId, userId, status, data = {} } = options;

    // Get status text in Vietnamese
    const statusText = getStatusText(status);
    
    const notification = await Notification.create({
      userId,
      type: 'ORDER_STATUS',
      title: `Cập nhật trạng thái đơn hàng #${data.orderNumber || orderId}`,
      message: `Đơn hàng của bạn đã được cập nhật sang trạng thái: ${statusText}`,
      data: {
        orderId,
        status,
        ...data
      },
      isRead: false
    });

    // Send notification via socket
    socketService.sendToUser(userId, 'notification', {
      notification,
      orderUpdate: {
        orderId,
        status,
        ...data
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating order status notification:', error);
    return null;
  }
};

/**
 * Create a notification for driver location update
 * @param {Object} options - Notification options
 */
exports.createDriverUpdateNotification = async (options) => {
  try {
    const { orderId, userId, driverLocation, eta } = options;
    
    // Get order for more details
    const order = await Order.findByPk(orderId);
    if (!order) return null;
    
    const notification = await Notification.create({
      userId,
      type: 'DRIVER_LOCATION',
      title: 'Cập nhật vị trí tài xế',
      message: eta 
        ? `Tài xế đang đến trong khoảng ${eta} phút` 
        : 'Vị trí tài xế vừa được cập nhật',
      data: {
        orderId,
        driverLocation,
        eta,
        orderNumber: order.orderNumber
      },
      isRead: false
    });

    // Send notification via socket
    socketService.sendToUser(userId, 'notification', {
      notification,
      driverUpdate: {
        orderId,
        driverLocation,
        eta
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating driver update notification:', error);
    return null;
  }
};

/**
 * Create a notification for ETA update
 * @param {Object} options - Notification options
 */
exports.createEtaUpdateNotification = async (options) => {
  try {
    const { orderId, userId, eta, reason } = options;
    
    // Get order for more details
    const order = await Order.findByPk(orderId);
    if (!order) return null;
    
    const message = reason 
      ? `Thời gian giao hàng dự kiến đã được cập nhật: ${eta} phút (${reason})`
      : `Thời gian giao hàng dự kiến đã được cập nhật: ${eta} phút`;
    
    const notification = await Notification.create({
      userId,
      type: 'ETA_UPDATE',
      title: 'Cập nhật thời gian giao hàng',
      message,
      data: {
        orderId,
        eta,
        reason,
        orderNumber: order.orderNumber
      },
      isRead: false
    });

    // Send notification via socket
    socketService.sendToUser(userId, 'notification', {
      notification,
      etaUpdate: {
        orderId,
        eta,
        reason
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating ETA update notification:', error);
    return null;
  }
};

// Helper function to get status text in Vietnamese
function getStatusText(status) {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'preparing': 'Đang chuẩn bị',
    'ready_for_pickup': 'Sẵn sàng giao',
    'out_for_delivery': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  };
  
  return statusMap[status] || status;
}

module.exports = {
  subscribe,
  unsubscribe,
  getPreferences,
  updatePreferences,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCounts,
  sendOrderStatusNotification,
  sendDriverLocationNotification,
  sendPromotionNotification,
  sendMarketingNotification,
  createOrderStatusNotification,
  createDriverUpdateNotification,
  createEtaUpdateNotification
};