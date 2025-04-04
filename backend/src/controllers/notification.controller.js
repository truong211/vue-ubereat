const db = require('../config/database');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/error.middleware');
const webpush = require('web-push');
const catchAsync = require('../utils/catchAsync');
const socketService = require('../services/socket.service');
const notificationTrackingService = require('../services/notificationTracking.service');
const logger = require('../utils/logger');

// Ensure we have the correct model references
const User = db.user;
const Order = db.order;
const Restaurant = db.restaurant;
const Driver = db.driver;
const Notification = db.notification;
const sequelize = require('sequelize');

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

    // Check if subscription exists
    const [existingSubscriptions] = await db.query(
      `SELECT * FROM notification_subscriptions 
       WHERE endpoint = ? AND userId = ?`,
      [subscription.endpoint, req.user.id]
    );

    let created = false;
    
    if (!existingSubscriptions || existingSubscriptions.length === 0) {
      // Create new subscription
      await db.query(
        `INSERT INTO notification_subscriptions 
         (userId, endpoint, subscription, userAgent, active, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [
          req.user.id, 
          subscription.endpoint, 
          JSON.stringify(subscription), 
          userAgent || req.headers['user-agent']
        ]
      );
      created = true;
    } else {
      // Update existing subscription
      await db.query(
        `UPDATE notification_subscriptions 
         SET subscription = ?, userAgent = ?, active = TRUE, updatedAt = NOW()
         WHERE endpoint = ? AND userId = ?`,
        [
          JSON.stringify(subscription),
          userAgent || req.headers['user-agent'],
          subscription.endpoint,
          req.user.id
        ]
      );
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
    const [subscriptions] = await db.query(
      `SELECT * FROM notification_subscriptions 
       WHERE endpoint = ? AND userId = ?`,
      [subscription.endpoint, req.user.id]
    );

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }

    // Mark as inactive (soft delete)
    await db.query(
      `UPDATE notification_subscriptions 
       SET active = FALSE, updatedAt = NOW() 
       WHERE endpoint = ? AND userId = ?`,
      [subscription.endpoint, req.user.id]
    );

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

    // Get user from database using direct SQL with the correct column name
    const [user] = await db.query(
      'SELECT id, notificationPreferences, isPhoneVerified FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Parse notification preferences (stored as JSON in the database)
    let preferences;
    try {
      preferences = user.notificationPreferences ? JSON.parse(user.notificationPreferences) : null;
    } catch (e) {
      preferences = null;
    }

    // Set default preferences if none exist
    if (!preferences) {
      preferences = {
        orderUpdates: true,
        promotions: true,
        driverLocation: true,
        marketing: false,
        email: true,
        push: true,
        sms: user.isPhoneVerified || false
      };
    }

    res.status(200).json({
      status: 'success',
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting notification preferences:', error);
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

    // First, get current preferences
    const [userResults] = await db.query(
      'SELECT notificationPreferences FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userResults || userResults.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Parse current preferences
    let currentPreferences;
    try {
      currentPreferences = userResults[0].notificationPreferences 
        ? JSON.parse(userResults[0].notificationPreferences) 
        : {};
    } catch (e) {
      currentPreferences = {};
    }

    // Merge with new preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };

    // Update in database
    await db.query(
      'UPDATE users SET notificationPreferences = ?, updatedAt = NOW() WHERE id = ?',
      [JSON.stringify(updatedPreferences), req.user.id]
    );

    res.status(200).json({
      status: 'success',
      data: updatedPreferences
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
    
    // Use direct SQL queries to avoid Sequelize model dependency
      const sql = `
      SELECT * FROM notifications 
        WHERE (userId = ? OR isSystemWide = true) 
          AND (validUntil IS NULL OR validUntil > NOW())
        ORDER BY createdAt DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      const countSql = `
      SELECT COUNT(*) as total FROM notifications 
        WHERE (userId = ? OR isSystemWide = true)
          AND (validUntil IS NULL OR validUntil > NOW())
      `;
      
    // Execute the queries
    const [notifications] = await db.query(sql, [req.user.id]);
    const [countResult] = await db.query(countSql, [req.user.id]);
    
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limitNum);
      
      res.status(200).json({
        status: 'success',
        data: {
          notifications,
          totalCount,
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
    const result = await db.query(
      `UPDATE notifications 
       SET isRead = TRUE, readAt = NOW() 
       WHERE id IN (${idList}) 
       AND (userId = ? OR isSystemWide = TRUE)`,
      [req.user.id]
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
    const result = await db.query(
      `UPDATE notifications 
       SET isRead = TRUE, readAt = NOW() 
       WHERE (userId = ? OR isSystemWide = TRUE) 
       AND isRead = FALSE`,
      [req.user.id]
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
    
    const result = await db.query(
      `DELETE FROM notifications 
       WHERE id = ? 
       AND (userId = ? OR isSystemWide = TRUE)`,
      [id, req.user.id]
    );
    
    if (result.affectedRows === 0) {
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
    const subscriptions = await db.notification.findAll({
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
    await db.notification.create({
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
    const subscriptions = await db.notification.findAll({
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
    await db.notification.create({
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
      const subscriptions = await db.notification.findAll({
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
      await db.notification.create({
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
      const subscriptions = await db.notification.findAll({
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
      await db.notification.create({
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
        isRead, 
        COUNT(*) as count 
      FROM notifications 
      WHERE (userId = ? OR isSystemWide = TRUE)
        AND (validUntil IS NULL OR validUntil > NOW())
      GROUP BY type, isRead
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
      
      // Add to unread count only if isRead is false
      if (!row.isRead) {
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
    
    const notification = await db.notification.create({
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
    
    const notification = await db.notification.create({
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
    
    const notification = await db.notification.create({
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

/**
 * Create new notification(s)
 * @route POST /api/notifications
 * @access Private (Admin)
 */
exports.create = async (req, res, next) => {
  try {
    const { title, message, type, userIds, isSystemWide, priority, validUntil, data } = req.body;

    if (!isSystemWide && (!userIds || !userIds.length)) {
      return res.status(400).json({
        status: 'error',
        message: 'Either userIds or isSystemWide must be provided'
      });
    }

    let notifications = [];

    if (isSystemWide) {
      // Create a single system-wide notification
      notifications = [await db.notification.create({
        title,
        message,
        type,
        isSystemWide: true,
        priority,
        validUntil: validUntil ? new Date(validUntil) : null,
        data
      })];
    } else {
      // Create individual notifications for specified users
      notifications = await Promise.all(
        userIds.map(userId =>
          db.notification.create({
            title,
            message,
            type,
            userId,
            priority,
            validUntil: validUntil ? new Date(validUntil) : null,
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
      WHERE (userId = ? OR isSystemWide = TRUE) 
        AND isRead = FALSE 
        AND (validUntil IS NULL OR validUntil > NOW())
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
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE id = ?',
      [req.params.id]
    );
    
    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
  }

    // Update the notification status
    await db.query(
      'UPDATE notifications SET active = ?, updatedAt = NOW() WHERE id = ?',
      [active ? 1 : 0, req.params.id]
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
      const [notifications] = await db.query(
        `SELECT n.id, n.title, n.message, n.type, n.isRead, 
                n.createdAt as timestamp, n.data 
         FROM notifications n 
         WHERE n.isSystemWide = TRUE 
            OR (n.userId = ?)
         ORDER BY n.createdAt DESC 
         LIMIT ${limit}`,
        [req.user.id]
      );

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
              read: !!notification.isRead,
              timestamp: notification.timestamp,
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