const db = require('../config/database');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/error.middleware');
const webpush = require('web-push');
const catchAsync = require('../utils/catchAsync');
const socketService = require('../services/socket.service');
const notificationTrackingService = require('../services/notificationTracking.service');
const logger = require('../utils/logger');

// Models
const { User, Notification, NotificationSubscription } = require('../models');

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
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription object'
      });
    }

    // Find or create subscription using Sequelize
    const [notificationSubscription, created] = await NotificationSubscription.findOrCreate({
      where: {
        endpoint: subscription.endpoint,
        user_id: req.user.id
      },
      defaults: {
        subscription: JSON.stringify(subscription),
        user_agent: userAgent || req.headers['user-agent'],
        active: true
      }
    });

    if (!created) {
      // Update existing subscription
      await notificationSubscription.update({
        subscription: JSON.stringify(subscription),
        user_agent: userAgent || req.headers['user-agent'],
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
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to subscribe to notifications',
      error: error.message
    });
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
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription object'
      });
    }

    // Find subscription
    const [subscriptions] = await NotificationSubscription.findAll({
      where: {
        endpoint: subscription.endpoint,
        user_id: req.user.id
      }
    });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }

    // Mark as inactive (soft delete)
    await subscriptions.update({ active: false });

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Successfully unsubscribed from notifications'
      }
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unsubscribe from notifications',
      error: error.message
    });
  }
};

/**
 * Get user's notification preferences
 * @route GET /api/notifications/preferences
 * @access Private
 */
exports.getPreferences = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in to access notification preferences.',
        code: 'AUTH_REQUIRED'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'notificationPreferences', 'isPhoneVerified']
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get default preferences
    const defaultPreferences = {
      orderUpdates: true,
      promotions: true,
      driverLocation: true,
      marketing: false,
      email: true,
      push: false,
      sms: false
    };

    let preferences = user.notificationPreferences;
    if (!preferences) {
      preferences = defaultPreferences;
    } else {
      try {
        if (typeof preferences === 'string') {
          preferences = JSON.parse(preferences);
        }
        preferences = { ...defaultPreferences, ...preferences };
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
        preferences = defaultPreferences;
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        preferences,
        isPhoneVerified: user.isPhoneVerified || false
      }
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notification preferences',
      error: error.message
    });
  }
};

/**
 * Update user's notification preferences
 * @route PUT /api/notifications/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in to update notification preferences.',
        code: 'AUTH_REQUIRED'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update preferences
    await user.update({
      notificationPreferences: {
        ...user.notificationPreferences,
        ...req.body
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        preferences: user.notificationPreferences,
        message: 'Notification preferences updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

/**
 * Get user's notifications
 * @route GET /api/notifications
 * @access Private
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in to access notifications.'
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10; 
    const offset = (pageNum - 1) * limitNum;
    
    // Use Sequelize with proper Op.or syntax
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { user_id: req.user.id },
              { is_system_wide: true }
            ]
          },
          {
            [Op.or]: [
              { valid_until: null },
              { valid_until: { [Op.gt]: new Date() } }
            ]
          }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    });
    
    const totalPages = Math.ceil(count / limitNum);
      
    res.status(200).json({
      status: 'success',
      data: {
        notifications: notifications.map(notification => ({
          ...notification.toJSON(),
          data: notification.data ? 
            (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) 
            : {}
        })),
        totalCount: count,
        totalPages,
        currentPage: pageNum
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Mark notifications as read
 * @route PATCH /api/notifications/read
 * @access Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Notification IDs are required'
      });
    }

    // Convert the array to a comma-separated string for the SQL IN clause
    const idList = notificationIds.join(',');
    
    // Update notifications as read using direct SQL
    const result = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { id: { [Op.in]: notificationIds }, user_id: { [Op.or]: [{ is_system_wide: true }, { user_id: req.user.id }] } } }
    );

    res.status(200).json({
      status: 'success',
      data: {
        updated: result.affectedRows || 0
      }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    // Update all notifications for this user as read using direct SQL
    const result = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: { [Op.or]: [{ is_system_wide: true }, { user_id: req.user.id }] }, is_read: false } }
    );

    res.status(200).json({
      status: 'success',
      data: {
        updated: result.affectedRows || 0
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await Notification.destroy({ where: { id, user_id: { [Op.or]: [{ is_system_wide: true }, { user_id: req.user.id }] } } });
    
    if (result === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found or you do not have permission to delete it'
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
      error: error.message
    });
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
    const user = await User.findByPk(order.user_id);
    
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
    const subscriptions = await NotificationSubscription.findAll({
      where: {
        user_id: user.id,
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
        message = `Your order #${order.order_number} has been confirmed by the restaurant.`;
        break;
      case 'preparing':
        title = 'Order in Preparation';
        message = `The restaurant is now preparing your order #${order.order_number}.`;
        break;
      case 'ready':
        title = 'Order Ready for Pickup';
        message = `Your order #${order.order_number} is ready for pickup by the driver.`;
        break;
      case 'picked_up':
        title = 'Order Picked Up';
        message = `Your order #${order.order_number} has been picked up by the driver.`;
        break;
      case 'on_the_way':
        title = 'Order On the Way';
        message = `Your order #${order.order_number} is on the way to you.`;
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = `Your order #${order.order_number} has been delivered.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${order.order_number} has been cancelled.`;
        break;
      default:
        title = 'Order Update';
        message = `Your order #${order.order_number} status has been updated to ${status}.`;
    }

    // Create notification payload
    const payload = JSON.stringify({
      title,
      message,
      icon: '/img/icons/notification-icon.png',
      badge: '/img/icons/badge-icon.png',
      type: 'order_status',
      data: {
        order_id: order.id,
        order_number: order.order_number,
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
      user_id: user.id,
      title,
      message,
      type: 'order_status',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        status,
        ...additionalData
      },
      read_at: null
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
    const user = await User.findByPk(order.user_id);
    
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
    const subscriptions = await NotificationSubscription.findAll({
      where: {
        user_id: user.id,
        active: true
      }
    });

    if (subscriptions.length === 0) {
      // No active subscriptions
      return;
    }

    // Get driver information
    const driver = await Driver.findByPk(order.driver_id);
    
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Create notification title and message
    const title = 'Driver Update';
    const message = `Your order #${order.order_number} will arrive in approximately ${eta} minutes.`;

    // Create notification payload
    const payload = JSON.stringify({
      title,
      message,
      icon: '/img/icons/driver-icon.png',
      badge: '/img/icons/badge-icon.png',
      type: 'driver_location',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        driver_id: driver.id,
        driver_name: driver.full_name,
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
      user_id: user.id,
      title,
      message,
      type: 'driver_location',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        driver_id: driver.id,
        driver_name: driver.full_name,
        location,
        eta
      },
      read_at: null
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
      const subscriptions = await NotificationSubscription.findAll({
        where: {
          user_id: user.id,
          active: true
        }
      });

      if (subscriptions.length === 0) {
        // No active subscriptions, skip
        continue;
      }

      // Get restaurant information if available
      let restaurant_name = '';
      if (promotion.restaurant_id) {
        const restaurant = await Restaurant.findByPk(promotion.restaurant_id);
        restaurant_name = restaurant ? restaurant.name : '';
      }

      // Create notification title and message
      const title = promotion.title || 'Special Offer';
      const message = restaurant_name ? 
        `${restaurant_name}: ${promotion.description}` : 
        promotion.description;

      // Create notification payload
      const payload = JSON.stringify({
        title,
        message,
        icon: promotion.image || '/img/icons/promotion-icon.png',
        badge: '/img/icons/badge-icon.png',
        type: 'promotion',
        data: {
          promotion_id: promotion.id,
          restaurant_id: promotion.restaurant_id,
          url: `/promotions/${promotion.id}`,
          valid_until: promotion.end_date
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
        user_id: user.id,
        title,
        message,
        type: 'promotion',
        data: {
          promotion_id: promotion.id,
          restaurant_id: promotion.restaurant_id,
          valid_until: promotion.end_date
        },
        read_at: null
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
      const subscriptions = await NotificationSubscription.findAll({
        where: {
          user_id: user.id,
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
        user_id: user.id,
        title,
        message,
        type: 'marketing',
        data,
        read_at: null
      });
    }
  } catch (error) {
    console.error('Error sending marketing notification:', error);
  }
};

/**
 * Get notification counts by type
 * @route GET /api/notifications/counts
 * @access Private
 */
exports.getNotificationCounts = async (req, res, next) => {
  try {
    // Get counts by type and read status using SQL
    const sql = `
      SELECT 
        type, 
        is_read, 
        COUNT(*) as count 
      FROM notifications 
      WHERE (user_id = ? OR is_system_wide = TRUE)
        AND (valid_until IS NULL OR valid_until > NOW())
      GROUP BY type, is_read
    `;
    
    const [results] = await db.query(sql, [req.user.id]);
    
    // Process results into counts by type
    const typeCounts = {};
    const typeUnreadCounts = {};
    
    results.forEach(row => {
      // Ensure the type property exists in both count objects
      if (!typeCounts[row.type]) {
        typeCounts[row.type] = 0;
        typeUnreadCounts[row.type] = 0;
      }
      
      // Add to total count for this type
      typeCounts[row.type] += parseInt(row.count);
      
      // Add to unread count only if is_read is false
      if (!row.is_read) {
        typeUnreadCounts[row.type] += parseInt(row.count);
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        total: typeCounts,
        unread: typeUnreadCounts
      }
    });
  } catch (error) {
    console.error('Error getting notification counts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notification counts',
      error: error.message
    });
  }
};

/**
 * Create a notification for order status change
 * @param {Object} options - Notification options
 * @param {string} options.order_id - Order ID
 * @param {string} options.user_id - User ID
 * @param {string} options.status - New order status
 * @param {Object} options.data - Additional data
 */
exports.createOrderStatusNotification = async (options) => {
  try {
    const { order_id, user_id, status, data = {} } = options;

    // Get status text in Vietnamese
    const statusText = getStatusText(status);
    
    const notification = await Notification.create({
      user_id,
      type: 'ORDER_STATUS',
      title: `Cập nhật trạng thái đơn hàng #${data.order_number || order_id}`,
      message: `Đơn hàng của bạn đã được cập nhật sang trạng thái: ${statusText}`,
      data: {
        order_id,
        status,
        ...data
      },
      read_at: null
    });

    // Send notification via socket
    socketService.sendToUser(user_id, 'notification', {
      notification,
      orderUpdate: {
        order_id,
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
    const { order_id, user_id, driver_location, eta } = options;
    
    // Get order for more details
    const order = await Order.findByPk(order_id);
    if (!order) return null;
    
    const notification = await Notification.create({
      user_id,
      type: 'DRIVER_LOCATION',
      title: 'Cập nhật vị trí tài xế',
      message: eta 
        ? `Tài xế đang đến trong khoảng ${eta} phút` 
        : 'Vị trí tài xế vừa được cập nhật',
      data: {
        order_id,
        driver_location,
        eta,
        order_number: order.order_number
      },
      read_at: null
    });

    // Send notification via socket
    socketService.sendToUser(user_id, 'notification', {
      notification,
      driverUpdate: {
        order_id,
        driver_location,
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
    const { order_id, user_id, eta, reason } = options;
    
    // Get order for more details
    const order = await Order.findByPk(order_id);
    if (!order) return null;
    
    const message = reason 
      ? `Thời gian giao hàng dự kiến đã được cập nhật: ${eta} phút (${reason})`
      : `Thời gian giao hàng dự kiến đã được cập nhật: ${eta} phút`;
    
    const notification = await Notification.create({
      user_id,
      type: 'ETA_UPDATE',
      title: 'Cập nhật thời gian giao hàng',
      message,
      data: {
        order_id,
        eta,
        reason,
        order_number: order.order_number
      },
      read_at: null
    });

    // Send notification via socket
    socketService.sendToUser(user_id, 'notification', {
      notification,
      etaUpdate: {
        order_id,
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

/**
 * Create new notification(s)
 * @route POST /api/notifications
 * @access Private (Admin)
 */
exports.create = async (req, res, next) => {
  try {
    const { title, message, type, userIds, is_system_wide, priority, valid_until, data } = req.body;

    if (!is_system_wide && (!userIds || !userIds.length)) {
      return res.status(400).json({
        status: 'error',
        message: 'Either userIds or is_system_wide must be provided'
      });
    }

    let notifications = [];

    if (is_system_wide) {
      // Create a single system-wide notification
      notifications = [await Notification.create({
        title,
        message,
        type,
        is_system_wide: true,
        priority,
        valid_until: valid_until ? new Date(valid_until) : null,
        data
      })];
    } else {
      // Create individual notifications for specified users
      notifications = await Promise.all(
        userIds.map(user_id =>
          Notification.create({
            title,
            message,
            type,
            user_id,
            priority,
            valid_until: valid_until ? new Date(valid_until) : null,
            data
          })
        )
      );
    }

    res.status(201).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create notifications',
      error: error.message
    });
  }
};

/**
 * Get count of unread notifications
 * @route GET /api/notifications/unread/count
 * @access Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    // Get count of unread notifications using direct SQL
    const sql = `
      SELECT COUNT(*) as unreadCount 
      FROM notifications 
      WHERE (user_id = ? OR is_system_wide = TRUE) 
        AND is_read = FALSE 
        AND (valid_until IS NULL OR valid_until > NOW())
    `;
    
    const [results] = await db.query(sql, [req.user.id]);
    const unreadCount = results[0]?.unreadCount || 0;

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount: parseInt(unreadCount)
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread notifications count',
      error: error.message
    });
  }
};

/**
 * Track notification delivery status
 * @route POST /api/notifications/:notificationId/track-delivery
 * @access Private
 */
exports.trackDelivery = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const { status, deviceInfo, errorDetails } = req.body;

    const tracking = await notificationTrackingService.trackDelivery(
      notificationId,
      req.user.id,
      status,
      deviceInfo,
      errorDetails
    );

    res.status(200).json({
      status: 'success',
      data: { tracking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track notification click
 * @route POST /api/notifications/:notificationId/track-click
 * @access Private
 */
exports.trackClick = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await notificationTrackingService.trackClick(notificationId, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Click tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery statistics
 * @route GET /api/notifications/delivery-stats
 * @access Private
 */
exports.getDeliveryStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await notificationTrackingService.getDeliveryStats(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user engagement metrics
 * @route GET /api/notifications/:userId/engagement
 * @access Private
 */
exports.getUserEngagement = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await notificationTrackingService.getUserEngagementMetrics(
      userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.status(200).json({
      status: 'success',
      data: { metrics }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification performance by type
 * @route GET /api/notifications/performance-by-type
 * @access Private
 */
exports.getPerformanceByType = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const performance = await notificationTrackingService.getPerformanceByType(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.status(200).json({
      status: 'success',
      data: { performance }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get best performing time slots for notifications
 * @route GET /api/notifications/analytics/time-slots
 * @access Private/Admin
 */
exports.getBestPerformingTimeSlots = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const timeSlots = await notificationTrackingService.getBestPerformingTimeSlots(parseInt(days));

    res.status(200).json({
      status: 'success',
      data: { timeSlots }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification status
 * @route PATCH /api/notifications/:id/status
 * @access Private - Admin only
 */
exports.updateStatus = async (req, res, next) => {
  try {
  const { active } = req.body;
    
    // First check if notification exists
    const [notifications] = await Notification.findAll({ where: { id: req.params.id } });
    
    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
  }

    // Update the notification status
    await Notification.update(
      { active: active ? 1 : 0, updatedAt: new Date() },
      { where: { id: req.params.id } }
    );

  res.status(200).json({
    status: 'success',
      message: `Notification ${active ? 'activated' : 'deactivated'} successfully`
  });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification status',
      error: error.message
    });
  }
};

/**
 * Get admin notifications
 * @route GET /api/admin/notifications
 * @access Admin only
 */
exports.getAdminNotifications = async (req, res, next) => {
  try {
    // Get the limit from query params or use default
    const limit = parseInt(req.query.limit) || 10;
    
    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        status: 'success',
        notifications: [] // Return empty array as fallback
      });
    }
    
    try {
      // Get notifications from database with a limit - use a numerical limit directly in the query
      // to avoid prepared statement type issues
      const notifications = await Notification.findAll({
        where: {
          $or: [
            { is_system_wide: true },
            { user_id: req.user.id }
          ]
        },
        order: [['createdAt', 'DESC']],
        limit
      });

      // Process notifications - ensure we have a valid array to map over
      const formattedNotifications = Array.isArray(notifications) 
        ? notifications.map(notification => {
            let data;
            try {
              data = notification.data ? JSON.parse(notification.data) : {};
            } catch (err) {
              data = {};
            }
            
            return {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type || 'system',
              priority: 'normal', // Default priority value since it doesn't exist in DB
              read: !!notification.is_read,
              timestamp: notification.createdAt,
              data
            };
          })
        : []; // Return empty array if notifications is not an array

      res.status(200).json({
        status: 'success',
        notifications: formattedNotifications
      });
    } catch (dbError) {
      console.error('Database error fetching admin notifications:', dbError);
      
      // Return empty notifications array instead of error
      res.status(200).json({
        status: 'success',
        notifications: []
      });
    }
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    
    // Return empty notifications array instead of error
    res.status(200).json({
      status: 'success',
      notifications: []
    });
  }
};