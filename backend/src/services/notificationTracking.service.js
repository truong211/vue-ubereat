const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Service for tracking notification delivery and user interactions
 */
class NotificationTrackingService {
  /**
   * Record that a notification was sent
   * @param {Object} notification - The notification object
   * @param {String} channel - Delivery channel (email, push, sms, in-app)
   * @returns {Promise<Object>} Tracking record
   */
  async trackSent(notification, channel) {
    try {
      const trackingData = {
        notificationId: notification.id,
        userId: notification.userId,
        channel,
        status: 'sent',
        sentAt: new Date(),
        metadata: JSON.stringify({
          notificationType: notification.type,
          title: notification.title
        })
      };

      const result = await db.query(
        'INSERT INTO notification_tracking SET ?',
        [trackingData]
      );

      return {
        id: result.insertId,
        ...trackingData
      };
    } catch (error) {
      logger.error('Error tracking notification sent:', error);
      return null;
    }
  }

  /**
   * Record that a notification was delivered
   * @param {Number} trackingId - ID of the tracking record
   * @param {Object} metadata - Additional metadata about delivery
   * @returns {Promise<Boolean>} Success status
   */
  async trackDelivered(trackingId, metadata = {}) {
    try {
      await db.query(
        `UPDATE notification_tracking 
         SET status = ?, deliveredAt = ?, metadata = JSON_MERGE_PATCH(metadata, ?)
         WHERE id = ?`,
        ['delivered', new Date(), JSON.stringify(metadata), trackingId]
      );
      return true;
    } catch (error) {
      logger.error('Error tracking notification delivered:', error);
      return false;
    }
  }

  /**
   * Record that a notification failed to deliver
   * @param {Number} trackingId - ID of the tracking record
   * @param {String} reason - Reason for failure
   * @returns {Promise<Boolean>} Success status
   */
  async trackFailed(trackingId, reason) {
    try {
      await db.query(
        `UPDATE notification_tracking 
         SET status = ?, metadata = JSON_MERGE_PATCH(metadata, ?)
         WHERE id = ?`,
        [
          'failed', 
          JSON.stringify({ failureReason: reason, failedAt: new Date() }), 
          trackingId
        ]
      );
      return true;
    } catch (error) {
      logger.error('Error tracking notification failure:', error);
      return false;
    }
  }

  /**
   * Record that a user opened a notification
   * @param {Number} notificationId - ID of the notification
   * @param {Number} userId - ID of the user
   * @returns {Promise<Boolean>} Success status
   */
  async trackOpened(notificationId, userId) {
    try {
      // First update notification itself
      await db.query(
        'UPDATE notifications SET isRead = true, readAt = ? WHERE id = ? AND userId = ?',
        [new Date(), notificationId, userId]
      );

      // Then update tracking record(s)
      await db.query(
        `UPDATE notification_tracking 
         SET status = ?, openedAt = ?, metadata = JSON_MERGE_PATCH(metadata, ?)
         WHERE notificationId = ? AND userId = ?`,
        [
          'opened', 
          new Date(), 
          JSON.stringify({ event: 'opened' }), 
          notificationId, 
          userId
        ]
      );
      return true;
    } catch (error) {
      logger.error('Error tracking notification opened:', error);
      return false;
    }
  }

  /**
   * Record that a user clicked/interacted with a notification
   * @param {Number} notificationId - ID of the notification
   * @param {Number} userId - ID of the user
   * @param {String} action - The action taken (e.g., 'clicked', 'dismissed')
   * @returns {Promise<Boolean>} Success status
   */
  async trackInteraction(notificationId, userId, action) {
    try {
      await db.query(
        `UPDATE notification_tracking 
         SET interactedAt = ?, metadata = JSON_MERGE_PATCH(metadata, ?)
         WHERE notificationId = ? AND userId = ?`,
        [
          new Date(), 
          JSON.stringify({ 
            action, 
            interactedAt: new Date() 
          }), 
          notificationId, 
          userId
        ]
      );
      return true;
    } catch (error) {
      logger.error('Error tracking notification interaction:', error);
      return false;
    }
  }

  /**
   * Get delivery statistics for a specific notification
   * @param {Number} notificationId - ID of the notification
   * @returns {Promise<Object>} Delivery statistics
   */
  async getDeliveryStats(notificationId) {
    try {
      const stats = await db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM 
          notification_tracking
        WHERE 
          notificationId = ?
        GROUP BY 
          status
      `, [notificationId]);

      // Format the results into an easy-to-use object
      const formatted = {
        sent: 0,
        delivered: 0,
        opened: 0,
        failed: 0
      };

      stats.forEach(stat => {
        formatted[stat.status] = stat.count;
      });

      // Calculate open rate if we have deliveries
      formatted.openRate = formatted.delivered > 0 
        ? (formatted.opened / formatted.delivered) * 100 
        : 0;

      return formatted;
    } catch (error) {
      logger.error('Error getting notification delivery stats:', error);
      return null;
    }
  }

  /**
   * Get user engagement metrics for notifications
   * @param {Number} userId - User ID to get metrics for (optional)
   * @param {Object} dateRange - Date range for metrics
   * @returns {Promise<Object>} User engagement metrics
   */
  async getUserEngagementMetrics(userId = null, dateRange = {}) {
    try {
      let whereClause = '';
      const params = [];

      if (userId) {
        whereClause += 'userId = ?';
        params.push(userId);
      }

      if (dateRange.start) {
        whereClause += whereClause ? ' AND ' : '';
        whereClause += 'sentAt >= ?';
        params.push(dateRange.start);
      }

      if (dateRange.end) {
        whereClause += whereClause ? ' AND ' : '';
        whereClause += 'sentAt <= ?';
        params.push(dateRange.end);
      }

      // Build the final query
      let query = `
        SELECT 
          COUNT(*) as totalSent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN interactedAt IS NOT NULL THEN 1 ELSE 0 END) as interacted
        FROM 
          notification_tracking
      `;

      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const [results] = await db.query(query, params);

      if (!results) {
        return {
          totalSent: 0,
          delivered: 0,
          opened: 0,
          interacted: 0,
          deliveryRate: 0,
          openRate: 0,
          interactionRate: 0
        };
      }

      // Calculate rates
      const totalSent = results.totalSent || 0;
      const delivered = results.delivered || 0;
      const opened = results.opened || 0;
      const interacted = results.interacted || 0;

      return {
        totalSent,
        delivered,
        opened,
        interacted,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        interactionRate: opened > 0 ? (interacted / opened) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting user engagement metrics:', error);
      return null;
    }
  }
}

module.exports = new NotificationTrackingService();