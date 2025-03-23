const { NotificationTracking, Notification, User } = require('../models');
const { Op } = require('sequelize');

class NotificationTrackingService {
  /**
   * Track notification delivery status
   */
  async trackDelivery(notificationId, userId, status, deviceInfo = {}, errorDetails = null) {
    try {
      const tracking = await NotificationTracking.create({
        notificationId,
        userId,
        deliveryStatus: status,
        deviceInfo,
        errorDetails,
        deliveredAt: status === 'delivered' ? new Date() : null
      });

      return tracking;
    } catch (error) {
      console.error('Error tracking notification delivery:', error);
      throw error;
    }
  }

  /**
   * Track notification click
   */
  async trackClick(notificationId, userId) {
    try {
      const tracking = await NotificationTracking.findOne({
        where: {
          notificationId,
          userId
        }
      });

      if (tracking) {
        await tracking.update({
          deliveryStatus: 'clicked',
          clickedAt: new Date()
        });
      } else {
        await NotificationTracking.create({
          notificationId,
          userId,
          deliveryStatus: 'clicked',
          clickedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error tracking notification click:', error);
      throw error;
    }
  }

  /**
   * Get notification delivery statistics
   */
  async getDeliveryStats(startDate = null, endDate = null) {
    try {
      const where = {};
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }

      const stats = await NotificationTracking.findAll({
        attributes: [
          'deliveryStatus',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['deliveryStatus']
      });

      const total = stats.reduce((acc, stat) => acc + parseInt(stat.getDataValue('count')), 0);
      const delivered = stats.find(s => s.deliveryStatus === 'delivered')?.getDataValue('count') || 0;
      const clicked = stats.find(s => s.deliveryStatus === 'clicked')?.getDataValue('count') || 0;
      const failed = stats.find(s => s.deliveryStatus === 'failed')?.getDataValue('count') || 0;

      return {
        total,
        delivered,
        clicked,
        failed,
        deliveryRate: total > 0 ? (delivered / total * 100).toFixed(2) : 0,
        clickRate: delivered > 0 ? (clicked / delivered * 100).toFixed(2) : 0,
        failureRate: total > 0 ? (failed / total * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(userId, startDate = null, endDate = null) {
    try {
      const where = { userId };
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }

      const tracking = await NotificationTracking.findAll({ where });
      const total = tracking.length;
      const viewed = tracking.filter(t => t.deliveryStatus === 'delivered').length;
      const clicked = tracking.filter(t => t.deliveryStatus === 'clicked').length;

      return {
        totalNotifications: total,
        viewedNotifications: viewed,
        clickedNotifications: clicked,
        viewRate: total > 0 ? (viewed / total * 100).toFixed(2) : 0,
        clickThroughRate: viewed > 0 ? (clicked / viewed * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting user engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Get notification performance by type
   */
  async getPerformanceByType(startDate = null, endDate = null) {
    try {
      const where = {};
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }

      const performance = await NotificationTracking.findAll({
        include: [{
          model: Notification,
          as: 'notification',
          attributes: ['type']
        }],
        attributes: [
          [sequelize.col('notification.type'), 'type'],
          [sequelize.fn('COUNT', sequelize.col('NotificationTracking.id')), 'total'],
          [
            sequelize.fn('SUM', 
              sequelize.literal("CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END")
            ),
            'delivered'
          ],
          [
            sequelize.fn('SUM',
              sequelize.literal("CASE WHEN delivery_status = 'clicked' THEN 1 ELSE 0 END")
            ),
            'clicked'
          ]
        ],
        where,
        group: [sequelize.col('notification.type')]
      });

      return performance.map(p => ({
        type: p.getDataValue('type'),
        total: parseInt(p.getDataValue('total')),
        delivered: parseInt(p.getDataValue('delivered')),
        clicked: parseInt(p.getDataValue('clicked')),
        deliveryRate: (p.getDataValue('delivered') / p.getDataValue('total') * 100).toFixed(2),
        clickRate: (p.getDataValue('clicked') / p.getDataValue('delivered') * 100).toFixed(2)
      }));
    } catch (error) {
      console.error('Error getting performance by type:', error);
      throw error;
    }
  }

  /**
   * Get best performing time slots
   */
  async getBestPerformingTimeSlots(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const clicks = await NotificationTracking.findAll({
        attributes: [
          [
            sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "clickedAt"')),
            'hour'
          ],
          [sequelize.fn('COUNT', sequelize.col('id')), 'clicks']
        ],
        where: {
          clickedAt: {
            [Op.gte]: startDate
          }
        },
        group: [sequelize.literal('EXTRACT(HOUR FROM "clickedAt")')],
        order: [[sequelize.literal('clicks'), 'DESC']]
      });

      return clicks.map(c => ({
        hour: c.getDataValue('hour'),
        clicks: parseInt(c.getDataValue('clicks')),
        timeSlot: `${c.getDataValue('hour')}:00 - ${c.getDataValue('hour')}:59`
      }));
    } catch (error) {
      console.error('Error getting best performing time slots:', error);
      throw error;
    }
  }
}

module.exports = new NotificationTrackingService();