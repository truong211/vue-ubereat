const { Notification, User, Review, Restaurant } = require('../models');
const socketService = require('./socket.service');
const logger = require('../utils/logger');

class NotificationService {
  // Existing notification methods
  static async createReviewResponseNotification(review, response) {
    const restaurant = await Restaurant.findByPk(review.restaurantId);
    
    return Notification.create({
      userId: review.userId,
      title: 'Phản hồi từ nhà hàng',
      message: `${restaurant.name} đã phản hồi đánh giá của bạn`,
      type: 'review_response',
      data: {
        reviewId: review.id,
        restaurantId: restaurant.id,
        response: response
      },
      isRead: false
    });
  }

  static async createReviewModerationNotification(review, status, reason) {
    return Notification.create({
      userId: review.userId,
      title: 'Cập nhật đánh giá',
      message: status === 'approved' 
        ? 'Đánh giá của bạn đã được phê duyệt'
        : 'Đánh giá của bạn đã bị từ chối',
      type: 'review_moderation',
      data: {
        reviewId: review.id,
        status: status,
        reason: reason
      },
      isRead: false
    });
  }

  static async createNewReviewNotification(review) {
    const restaurant = await Restaurant.findByPk(review.restaurantId, {
      include: [{ model: User, as: 'owner' }]
    });

    if (restaurant?.owner) {
      return Notification.create({
        userId: restaurant.owner.id,
        title: 'Đánh giá mới',
        message: `Nhà hàng của bạn vừa nhận được đánh giá ${review.rating} sao`,
        type: 'new_review',
        data: {
          reviewId: review.id,
          restaurantId: restaurant.id,
          rating: review.rating
        },
        isRead: false
      });
    }
  }

  static async createReviewReportNotification(report) {
    // Notify moderators about new review reports
    const moderators = await User.findAll({
      where: {
        role: ['admin', 'moderator']
      }
    });

    const notifications = moderators.map(moderator => ({
      userId: moderator.id,
      title: 'Báo cáo đánh giá mới',
      message: 'Có đánh giá mới bị báo cáo cần xem xét',
      type: 'review_report',
      data: {
        reportId: report.id,
        reviewId: report.reviewId,
        reason: report.reason
      },
      isRead: false
    }));

    return Notification.bulkCreate(notifications);
  }

  /**
   * Create a notification for a user
   * @param {Object} notificationData - The notification data
   * @returns {Promise<Notification>}
   */
  static async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      
      // Send real-time notification via socket if applicable
      if (socketService.isUserOnline(notificationData.userId)) {
        socketService.sendToUser(notificationData.userId, 'new_notification', {
          notification
        });
      }
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create order status notification
   * @param {Object} order - The order object
   * @param {string} status - The new status
   * @param {string} message - The notification message
   * @returns {Promise<Notification>}
   */
  static async createOrderStatusNotification(order, status, message) {
    try {
      const notification = await this.createNotification({
        userId: order.userId,
        title: `Order #${order.orderNumber} ${status}`,
        message: message,
        type: 'order_status',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: status
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'order_status_updated', {
        orderId: order.id,
        status: status,
        message: message,
        timestamp: new Date()
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating order status notification:', error);
      throw error;
    }
  }

  /**
   * Create new order notification for restaurant
   * @param {Object} order - The order object
   * @returns {Promise<Notification>}
   */
  static async createNewOrderNotification(order) {
    try {
      const restaurant = await Restaurant.findByPk(order.restaurantId, {
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!restaurant?.owner?.id) {
        logger.error(`Restaurant owner not found for restaurant ID: ${order.restaurantId}`);
        return null;
      }
      
      const notification = await this.createNotification({
        userId: restaurant.owner.id,
        title: 'New Order',
        message: `New order #${order.orderNumber} has been placed`,
        type: 'new_order',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.totalAmount
        },
        isRead: false
      });
      
      // Send real-time notification via socket
      socketService.sendToRoom(`restaurant:${order.restaurantId}`, 'new_order', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        items: order.items,
        timestamp: new Date()
      });
      
      // Play sound alert
      socketService.sendToRoom(`restaurant:${order.restaurantId}`, 'play_alert', {
        type: 'new_order'
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating new order notification:', error);
      throw error;
    }
  }

  /**
   * Create driver assignment notification
   * @param {Object} order - The order object
   * @param {Object} driver - The driver object
   * @returns {Promise<Notification>}
   */
  static async createDriverAssignmentNotification(order, driver) {
    try {
      // Notify the driver
      const driverNotification = await this.createNotification({
        userId: driver.id,
        title: 'New Order Assignment',
        message: `You have been assigned order #${order.orderNumber}`,
        type: 'driver_assignment',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantId: order.restaurantId,
          restaurantAddress: order.restaurantAddress,
          deliveryAddress: order.deliveryAddress
        },
        isRead: false
      });
      
      // Notify the customer
      const customerNotification = await this.createNotification({
        userId: order.userId,
        title: 'Driver Assigned',
        message: `A driver has been assigned to your order #${order.orderNumber}`,
        type: 'driver_assigned',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          driverId: driver.id,
          driverName: driver.fullName,
          driverPhone: driver.phone,
          driverImage: driver.profileImage
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'driver_assigned', {
        orderId: order.id,
        driver: {
          id: driver.id,
          name: driver.fullName,
          phone: driver.phone,
          profileImage: driver.profileImage
        }
      });
      
      return { driverNotification, customerNotification };
    } catch (error) {
      logger.error('Error creating driver assignment notification:', error);
      throw error;
    }
  }

  /**
   * Create driver location update notification
   * @param {Object} order - The order object
   * @param {Object} location - The location object
   * @returns {Promise<void>}
   */
  static async sendDriverLocationUpdate(order, location) {
    try {
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'driver_location_updated', {
        orderId: order.id,
        driverId: order.driverId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error sending driver location update:', error);
      throw error;
    }
  }

  /**
   * Create order cancellation notification
   * @param {Object} order - The order object
   * @param {string} reason - The cancellation reason
   * @param {string} cancelledBy - Who cancelled the order
   * @returns {Promise<Notification[]>}
   */
  static async createOrderCancellationNotifications(order, reason, cancelledBy) {
    try {
      const notifications = [];
      
      // Notify the customer if cancelled by restaurant or system
      if (cancelledBy === 'restaurant' || cancelledBy === 'system') {
        const customerNotification = await this.createNotification({
          userId: order.userId,
          title: 'Order Cancelled',
          message: `Your order #${order.orderNumber} has been cancelled`,
          type: 'order_cancelled',
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason: reason,
            cancelledBy: cancelledBy
          },
          isRead: false
        });
        
        notifications.push(customerNotification);
      }
      
      // Notify the restaurant if cancelled by customer
      if (cancelledBy === 'customer') {
        const restaurant = await Restaurant.findByPk(order.restaurantId, {
          include: [{ model: User, as: 'owner' }]
        });
        
        if (restaurant?.owner?.id) {
          const restaurantNotification = await this.createNotification({
            userId: restaurant.owner.id,
            title: 'Order Cancelled',
            message: `Order #${order.orderNumber} has been cancelled by the customer`,
            type: 'order_cancelled',
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              reason: reason,
              cancelledBy: cancelledBy
            },
            isRead: false
          });
          
          notifications.push(restaurantNotification);
        }
      }
      
      // Notify the driver if assigned
      if (order.driverId) {
        const driverNotification = await this.createNotification({
          userId: order.driverId,
          title: 'Order Cancelled',
          message: `Order #${order.orderNumber} has been cancelled`,
          type: 'order_cancelled',
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason: reason,
            cancelledBy: cancelledBy
          },
          isRead: false
        });
        
        notifications.push(driverNotification);
      }
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'order_cancelled', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: reason,
        cancelledBy: cancelledBy,
        timestamp: new Date()
      });
      
      return notifications;
    } catch (error) {
      logger.error('Error creating order cancellation notifications:', error);
      throw error;
    }
  }

  /**
   * Create delivery completed notification
   * @param {Object} order - The order object
   * @returns {Promise<Notification>}
   */
  static async createDeliveryCompletedNotification(order) {
    try {
      const notification = await this.createNotification({
        userId: order.userId,
        title: 'Order Delivered',
        message: `Your order #${order.orderNumber} has been delivered`,
        type: 'order_delivered',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'order_delivered', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        timestamp: new Date()
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating delivery completed notification:', error);
      throw error;
    }
  }

  /**
   * Create driver status change notification
   * @param {Object} driver - The driver object
   * @param {string} status - The new status
   * @returns {Promise<Notification>}
   */
  static async createDriverStatusChangeNotification(driver, status) {
    try {
      // Only notify admin users about driver status changes
      const adminUsers = await User.findAll({
        where: { role: 'admin' }
      });
      
      const notifications = [];
      
      for (const admin of adminUsers) {
        const notification = await this.createNotification({
          userId: admin.id,
          title: 'Driver Status Change',
          message: `Driver ${driver.fullName} is now ${status}`,
          type: 'driver_status_change',
          data: {
            driverId: driver.id,
            driverName: driver.fullName,
            status: status
          },
          isRead: false
        });
        
        notifications.push(notification);
      }
      
      // Broadcast to admin dashboard
      socketService.sendToRole('admin', 'driver_status_changed', {
        driverId: driver.id,
        driverName: driver.fullName,
        status: status,
        timestamp: new Date()
      });
      
      return notifications;
    } catch (error) {
      logger.error('Error creating driver status change notification:', error);
      throw error;
    }
  }

  /**
   * Create order pickup notification for customer
   * @param {Object} order - The order object
   * @param {Object} driver - The driver object
   * @returns {Promise<Notification>}
   */
  static async createOrderPickupNotification(order, driver) {
    try {
      const notification = await this.createNotification({
        userId: order.userId,
        title: 'Order Picked Up',
        message: `Your order #${order.orderNumber} has been picked up by the driver and is on the way`,
        type: 'order_pickup',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          driverId: driver.id,
          driverName: driver.fullName,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'order_pickup', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'out_for_delivery',
        driverId: driver.id,
        driverName: driver.fullName,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timestamp: new Date()
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating order pickup notification:', error);
      throw error;
    }
  }

  /**
   * Create driver arrival notification
   * @param {Object} order - The order object
   * @returns {Promise<Notification>}
   */
  static async createDriverArrivalNotification(order) {
    try {
      const notification = await this.createNotification({
        userId: order.userId,
        title: 'Driver Nearby',
        message: `Your driver is nearby and will arrive shortly with order #${order.orderNumber}`,
        type: 'driver_arrival',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'driver_arrival', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        timestamp: new Date()
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating driver arrival notification:', error);
      throw error;
    }
  }

  /**
   * Create driver earnings notification
   * @param {Object} driver - The driver object
   * @param {Object} order - The order object
   * @param {number} amount - The earnings amount
   * @returns {Promise<Notification>}
   */
  static async createDriverEarningsNotification(driver, order, amount) {
    try {
      const notification = await this.createNotification({
        userId: driver.id,
        title: 'Earnings Updated',
        message: `You earned ${amount.toFixed(2)} from order #${order.orderNumber}`,
        type: 'driver_earnings',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: amount
        },
        isRead: false
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating driver earnings notification:', error);
      throw error;
    }
  }

  /**
   * Create estimated arrival time update notification
   * @param {Object} order - The order object
   * @param {Date} estimatedArrival - The new estimated arrival time
   * @returns {Promise<Notification>}
   */
  static async createETAUpdateNotification(order, estimatedArrival) {
    try {
      // Format estimated arrival time (e.g., "10 minutes")
      const now = new Date();
      const etaMinutes = Math.ceil((estimatedArrival - now) / (1000 * 60));
      const etaText = etaMinutes > 0 ? `${etaMinutes} minutes` : 'very soon';
      
      const notification = await this.createNotification({
        userId: order.userId,
        title: 'Delivery Time Updated',
        message: `Your order #${order.orderNumber} will arrive in ${etaText}`,
        type: 'eta_update',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          estimatedArrival: estimatedArrival
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'eta_updated', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedArrival: estimatedArrival,
        etaMinutes: etaMinutes,
        timestamp: new Date()
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating ETA update notification:', error);
      throw error;
    }
  }

  /**
   * Create delivery confirmation request notification
   * @param {Object} order - The order object
   * @returns {Promise<Notification>}
   */
  static async createDeliveryConfirmationRequestNotification(order) {
    try {
      const notification = await this.createNotification({
        userId: order.userId,
        title: 'Confirm Your Delivery',
        message: `Please confirm receipt of your order #${order.orderNumber}`,
        type: 'delivery_confirmation_request',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber
        },
        isRead: false
      });
      
      // Send real-time update via socket
      socketService.sendToRoom(`order:${order.id}`, 'delivery_confirmation_request', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        timestamp: new Date()
      });
      
      return notification;
    } catch (error) {
      logger.error('Error creating delivery confirmation request notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;