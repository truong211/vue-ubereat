const { Promotion, PromotionCampaign, UserPromotion, Order } = require('../models');
const { Op } = require('sequelize');
const { 
  logPromotionActivity, 
  logPromotionError, 
  logPromotionMetrics, 
  logSuspiciousActivity 
} = require('../utils/promotionLogger');
const logger = require('../utils/logger');

class PromotionMonitoringService {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  async monitorHealthMetrics() {
    try {
      await this.detectRedemptionAnomalies();
      await this.monitorCampaignPerformance();
      await this.detectSuspiciousActivity();
      await this.updatePromotionStatuses();

      // Log overall health metrics
      logPromotionMetrics({
        type: 'health_check',
        timestamp: new Date(),
        activePromotions: await Promotion.count({ where: { status: 'active' } }),
        activeCampaigns: await PromotionCampaign.count({ where: { status: 'active' } })
      });
    } catch (error) {
      logPromotionError(error, { 
        operation: 'monitorHealthMetrics',
        severity: 'high'
      });
    }
  }

  async detectRedemptionAnomalies() {
    const timeWindow = new Date();
    timeWindow.setHours(timeWindow.getHours() - 1);

    try {
      const activePromotions = await Promotion.findAll({
        where: { status: 'active' }
      });

      for (const promotion of activePromotions) {
        const recentRedemptions = await UserPromotion.count({
          where: {
            promotionId: promotion.id,
            createdAt: { [Op.gte]: timeWindow }
          }
        });

        if (recentRedemptions > promotion.averageHourlyRedemptions * 3) {
          logSuspiciousActivity({
            type: 'high_redemption_rate',
            promotionId: promotion.id,
            code: promotion.code,
            redemptionCount: recentRedemptions,
            expectedMax: promotion.averageHourlyRedemptions * 3
          });

          this.notificationService.notifyAdmin('promotion_alert', {
            type: 'high_redemption_rate',
            promotionId: promotion.id,
            code: promotion.code,
            message: `Unusually high redemption rate detected for promotion ${promotion.code}`
          });
        }
      }
    } catch (error) {
      logPromotionError(error, {
        operation: 'detectRedemptionAnomalies',
        timeWindow: timeWindow.toISOString()
      });
    }
  }

  async monitorCampaignPerformance() {
    try {
      const activeCampaigns = await PromotionCampaign.findAll({
        where: { status: 'active' },
        include: [{
          model: Promotion,
          as: 'promotions'
        }]
      });

      for (const campaign of activeCampaigns) {
        const totalRedemptions = campaign.promotions.reduce(
          (sum, p) => sum + p.currentRedemptions, 
          0
        );

        const totalRevenue = await Order.sum('totalAmount', {
          include: [{
            model: UserPromotion,
            where: {
              promotionId: {
                [Op.in]: campaign.promotions.map(p => p.id)
              }
            }
          }]
        });

        const metrics = {
          totalRedemptions,
          totalRevenue,
          averageOrderValue: totalRevenue / totalRedemptions || 0
        };

        // Log campaign performance metrics
        logPromotionMetrics({
          type: 'campaign_performance',
          campaignId: campaign.id,
          campaignName: campaign.name,
          ...metrics
        });

        await campaign.update({
          metrics: {
            ...campaign.metrics,
            ...metrics,
            lastUpdated: new Date()
          }
        });

        if (campaign.budget) {
          const budgetUsagePercent = (campaign.spentAmount / campaign.budget) * 100;
          if (budgetUsagePercent >= 80) {
            logPromotionActivity({
              type: 'budget_warning',
              campaignId: campaign.id,
              budgetUsagePercent,
              spentAmount: campaign.spentAmount,
              totalBudget: campaign.budget
            });

            if (budgetUsagePercent >= 80 && budgetUsagePercent < 90) {
              this.notificationService.notifyAdmin('campaign_alert', {
                type: 'budget_warning',
                campaignId: campaign.id,
                name: campaign.name,
                message: `Campaign "${campaign.name}" has used ${Math.round(budgetUsagePercent)}% of its budget`
              });
            }
          }
        }
      }
    } catch (error) {
      logPromotionError(error, {
        operation: 'monitorCampaignPerformance'
      });
    }
  }

  async detectSuspiciousActivity() {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - 30);

    try {
      const suspiciousUsers = await UserPromotion.findAll({
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'redemptionCount']
        ],
        where: {
          createdAt: { [Op.gte]: timeWindow }
        },
        group: ['userId'],
        having: sequelize.literal('COUNT(id) > 5')
      });

      for (const user of suspiciousUsers) {
        logSuspiciousActivity({
          type: 'multiple_redemptions',
          userId: user.userId,
          redemptionCount: user.get('redemptionCount'),
          timeWindow: '30min'
        });

        this.notificationService.notifyAdmin('promotion_alert', {
          type: 'suspicious_activity',
          userId: user.userId,
          message: `Suspicious promotion redemption activity detected for user ${user.userId}`
        });
      }
    } catch (error) {
      logPromotionError(error, {
        operation: 'detectSuspiciousActivity',
        timeWindow: timeWindow.toISOString()
      });
    }
  }

  async updatePromotionStatuses() {
    const now = new Date();

    try {
      // Expire promotions past end date
      const expiredCount = await Promotion.update(
        { status: 'expired' },
        {
          where: {
            status: 'active',
            endDate: { [Op.lt]: now }
          }
        }
      );

      // Auto-activate scheduled promotions
      const activatedCount = await Promotion.update(
        { status: 'active' },
        {
          where: {
            status: 'scheduled',
            startDate: { [Op.lte]: now },
            endDate: { [Op.gt]: now }
          }
        }
      );

      logPromotionActivity({
        type: 'status_update',
        expiredCount: expiredCount[0],
        activatedCount: activatedCount[0],
        timestamp: now
      });
    } catch (error) {
      logPromotionError(error, {
        operation: 'updatePromotionStatuses'
      });
    }
  }

  startMonitoring() {
    logPromotionActivity({
      type: 'monitoring_started',
      message: 'Promotion monitoring service started'
    });

    // Run health check every 5 minutes
    setInterval(() => {
      this.monitorHealthMetrics();
    }, 5 * 60 * 1000);

    // Run status updates every minute
    setInterval(() => {
      this.updatePromotionStatuses();
    }, 60 * 1000);
  }
}

module.exports = PromotionMonitoringService;