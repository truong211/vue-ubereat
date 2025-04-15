const { Op } = require('sequelize');
const db = require('../config/database');
const { Promotion, User } = require('../models');
const logger = require('../utils/logger');
const {
  logPromotionActivity, 
  logPromotionError, 
  logPromotionMetrics, 
  logSuspiciousActivity 
} = require('../utils/promotionLogger');

class PromotionMonitoringService {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.setupScheduledJobs();
  }

  async monitorHealthMetrics() {
    try {
      await this.detectRedemptionAnomalies();
      await this.monitorCampaignPerformance();
      await this.detectSuspiciousActivity();
      await this.updatePromotionStatuses();

      // Log overall health metrics
      const [activePromotionsResult] = await Promotion.count({
        where: {
          is_active: true
        }
      });
      
      logPromotionMetrics({
        type: 'health_check',
        timestamp: new Date(),
        activePromotions: activePromotionsResult,
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
    const timeWindowStr = timeWindow.toISOString().slice(0, 19).replace('T', ' ');

    try {
      // Get active promotions
      const activePromotions = await Promotion.findAll({
        where: {
          is_active: true
        }
      });

      for (const promotion of activePromotions) {
        // Count recent redemptions
        const [recentRedemptionsResult] = await Promotion.count({
          where: {
            id: promotion.id,
            createdAt: {
              [Op.gte]: timeWindowStr
            }
          }
        });
        
        const averageHourlyRedemptions = promotion.averageHourlyRedemptions || 1;

        if (recentRedemptionsResult > averageHourlyRedemptions * 3) {
          logSuspiciousActivity({
            type: 'high_redemption_rate',
            promotionId: promotion.id,
            code: promotion.code,
            redemptionCount: recentRedemptionsResult,
            expectedMax: averageHourlyRedemptions * 3
          });

          if (this.notificationService) {
            this.notificationService.notifyAdmin('promotion_alert', {
              type: 'high_redemption_rate',
              promotionId: promotion.id,
              code: promotion.code,
              message: `Unusually high redemption rate detected for promotion ${promotion.code}`
            });
          }
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
      // Get active campaigns with their promotions
      const activeCampaigns = await Promotion.findAll({
        attributes: [
          'id',
          'name',
          'campaign_id',
          'status',
          'metrics',
          'budget',
          'spentAmount',
          'lastUpdated'
        ],
        include: [
          {
            model: Promotion,
            attributes: ['id'],
            as: 'promotions',
            through: { attributes: [] }
          }
        ],
        where: {
          status: 'active'
        },
        group: ['promotion_campaigns.id']
      });

      for (const campaign of activeCampaigns) {
        // Parse promotion IDs
        const promotionIds = campaign.promotions.map(p => p.id);
        
        if (promotionIds.length === 0) continue;
        
        // Calculate total redemptions
        const [redemptionsResult] = await Promotion.count({
          where: {
            id: {
              [Op.in]: promotionIds
            }
          }
        });
        
        const totalRedemptions = redemptionsResult;

        // Calculate total revenue from orders using these promotions
        const [revenueResult] = await Promotion.sum('totalAmount', {
          where: {
            id: {
              [Op.in]: promotionIds
            }
          }
        });
        
        const totalRevenue = revenueResult || 0;
        const averageOrderValue = totalRedemptions > 0 ? totalRevenue / totalRedemptions : 0;

        const metrics = {
          totalRedemptions,
          totalRevenue,
          averageOrderValue
        };

        // Log campaign performance metrics
        logPromotionMetrics({
          type: 'campaign_performance',
          campaignId: campaign.id,
          campaignName: campaign.name,
          ...metrics
        });

        // Update campaign metrics
        const updatedMetrics = JSON.stringify({
          ...JSON.parse(campaign.metrics || '{}'),
            ...metrics,
            lastUpdated: new Date()
        });
        
        await Promotion.update(
          { metrics: updatedMetrics },
          {
            where: {
              id: campaign.id
            }
          }
        );

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

            if (budgetUsagePercent >= 80 && budgetUsagePercent < 90 && this.notificationService) {
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
    const timeWindowStr = timeWindow.toISOString().slice(0, 19).replace('T', ' ');

    try {
      // Find users with suspicious redemption patterns
      const [suspiciousUsers] = await db.query(`
        SELECT 
          userId, 
          COUNT(id) as redemptionCount
        FROM 
          user_promotions
        WHERE 
          createdAt >= ?
        GROUP BY 
          userId
        HAVING 
          COUNT(id) > 5
      `, {
        replacements: [timeWindowStr],
        type: db.QueryTypes.SELECT
      });

      for (const user of suspiciousUsers) {
        logSuspiciousActivity({
          type: 'multiple_redemptions',
          userId: user.userId,
          redemptionCount: user.redemptionCount,
          timeWindow: '30min'
        });

        if (this.notificationService) {
          this.notificationService.notifyAdmin('promotion_alert', {
            type: 'suspicious_activity',
            userId: user.userId,
            message: `Suspicious promotion redemption activity detected for user ${user.userId}`
          });
        }
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
      // Get all active promotions that need status update
      const promotionsToUpdate = await Promotion.findAll({
        where: {
          [Op.or]: [
            {
              is_active: false,
              start_date: { [Op.lte]: now },
              end_date: { [Op.gt]: now }
            },
            {
              is_active: true,
              [Op.or]: [
                { end_date: { [Op.lte]: now } }
              ]
            }
          ]
        },
        attributes: ['id', 'code', 'description', 'start_date', 'end_date', 'usage_limit', 'is_active']
      });

      for (const promotion of promotionsToUpdate) {
        let shouldBeActive = true;
        
        // Check dates
        if (now < promotion.start_date || now > promotion.end_date) {
          shouldBeActive = false;
        }
        
        // Check usage limit if applicable
        if (shouldBeActive && promotion.usage_limit) {
          const [redemptionResult] = await db.query(
            'SELECT COUNT(*) as count FROM promotion_redemptions WHERE promotion_id = ?',
            {
              replacements: [promotion.id],
              type: db.QueryTypes.SELECT
            }
          );
          
          const redemptionCount = redemptionResult ? redemptionResult.count : 0;
          if (redemptionCount >= promotion.usage_limit) {
            shouldBeActive = false;
          }
        }
        
        // Update status if needed
        if (promotion.is_active !== shouldBeActive) {
          await promotion.update({ is_active: shouldBeActive });
          
          logPromotionActivity({
            type: 'status_update',
            promotionId: promotion.id,
            code: promotion.code,
            description: promotion.description,
            oldStatus: promotion.is_active,
            newStatus: shouldBeActive
          });
        }
      }
    } catch (error) {
      console.error('[PromotionMonitoring] Error in updatePromotionStatuses:', error);
      logPromotionError(error, {
        operation: 'updatePromotionStatuses'
      });
    }
  }

  async monitorPromotions() {
    console.log('[PromotionMonitoring] Running scheduled promotion monitoring...');
    try {
      await this.deactivateExpiredPromotions();
      await this.checkLowRedemptions();
      await this.updatePromotionStatuses();
      console.log('[PromotionMonitoring] Completed promotion monitoring check.');
    } catch (error) {
      console.error('[PromotionMonitoring] Error:', error);
    }
  }

  async deactivateExpiredPromotions() {
    try {
      const now = new Date();
      
      // Get expired but still active promotions
      const expiredPromotions = await Promotion.findAll({
        where: {
          is_active: true,
          end_date: {
            [Op.lt]: now
          }
        }
      });
      
      if (expiredPromotions.length > 0) {
        console.log(`[PromotionMonitoring] Found ${expiredPromotions.length} expired promotions.`);
        
        // Deactivate expired promotions
        await Promotion.update(
          { is_active: false },
          {
            where: {
              end_date: {
                [Op.lt]: now
              }
            }
          }
        );
        
        // Log deactivations
        for (const promo of expiredPromotions) {
          console.log(`[PromotionMonitoring] Deactivated expired promotion: ${promo.code} (ID: ${promo.id})`);
          
          // Log the action in the admin activity log using Sequelize
          await db.query(
            'INSERT INTO user_activity_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())',
            {
              replacements: [
                1, // Admin user ID
                'system_promotion_expired',
                JSON.stringify({
                  promotionId: promo.id,
                  code: promo.code,
                  name: promo.name,
                  endDate: promo.end_date
                })
              ],
              type: db.QueryTypes.INSERT
            }
          );
        }
      }
    } catch (error) {
      console.error('[PromotionMonitoring] Error in deactivateExpiredPromotions:', error);
      throw error;
    }
  }

  async checkLowRedemptions() {
    try {
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      // Get active promotions that are about to expire
      const lowRedemptionPromotions = await Promotion.findAll({
        where: {
          is_active: true,
          end_date: {
            [Op.between]: [now, in48Hours]
          },
          usage_limit: {
            [Op.gt]: 0
          }
        },
        attributes: [
          'id',
          'code',
          'description',
          'end_date',
          'usage_limit'
        ]
      });
      
      const promotionsToAlert = [];
      
      // Check each promotion's redemption count
      for (const promo of lowRedemptionPromotions) {
        // Get redemption count from promotion_redemptions table
        const [redemptionResult] = await db.query(
          'SELECT COUNT(*) as count FROM promotion_redemptions WHERE promotion_id = ?',
          {
            replacements: [promo.id],
            type: db.QueryTypes.SELECT
          }
        );
        
        const redemptionCount = redemptionResult ? redemptionResult.count : 0;
        const redemptionPercent = (redemptionCount / promo.usage_limit) * 100;
        
        if (redemptionPercent < 30) {
          promotionsToAlert.push({
            ...promo.toJSON(),
            redemptionCount,
            redemptionPercent
          });
        }
      }
      
      if (promotionsToAlert.length > 0) {
        console.log(`[PromotionMonitoring] Found ${promotionsToAlert.length} promotions with low redemption rates that are expiring soon.`);
        
        // Log alert for each promotion with low redemptions
        for (const promo of promotionsToAlert) {
          console.log(`[PromotionMonitoring] Low redemption alert: ${promo.code} (${promo.redemptionPercent.toFixed(2)}% used, expires ${promo.end_date})`);
          
          // Create notification for admin
          await db.query(
            'INSERT INTO notifications (user_id, title, message, type, data, is_read) VALUES (?, ?, ?, ?, ?, false)',
            {
              replacements: [
                1, // Admin user ID
                'Low Promotion Usage Alert',
                `Promotion ${promo.code} (${promo.description || 'No description'}) has only ${promo.redemptionPercent.toFixed(2)}% redemption and will expire soon.`,
                'promotion_alert',
                JSON.stringify({
                  promotionId: promo.id,
                  code: promo.code,
                  description: promo.description,
                  redemptionPercent: promo.redemptionPercent,
                  endDate: promo.end_date
                })
              ],
              type: db.QueryTypes.INSERT
            }
          );
        }
      }
    } catch (error) {
      console.error('[PromotionMonitoring] Error in checkLowRedemptions:', error);
      throw error;
    }
  }

  setupScheduledJobs() {
    // Run every 6 hours
    setInterval(() => this.monitorPromotions(), 6 * 60 * 60 * 1000);
    
    // Also run once when service starts
    setTimeout(() => this.monitorPromotions(), 5000);
  }
}

module.exports = new PromotionMonitoringService();