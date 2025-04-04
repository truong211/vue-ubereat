const db = require('../config/database');
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
    this.setupScheduledJobs();
  }

  async monitorHealthMetrics() {
    try {
      await this.detectRedemptionAnomalies();
      await this.monitorCampaignPerformance();
      await this.detectSuspiciousActivity();
      await this.updatePromotionStatuses();

      // Log overall health metrics
      const [activePromotionsResult] = await db.query(
        'SELECT COUNT(*) as count FROM promotions WHERE isActive = true'
      );
      const [activeCampaignsResult] = await db.query(
        'SELECT COUNT(*) as count FROM promotion_campaigns WHERE status = "active"'
      );
      
      const activePromotions = activePromotionsResult?.count || 0;
      const activeCampaigns = activeCampaignsResult?.count || 0;

      logPromotionMetrics({
        type: 'health_check',
        timestamp: new Date(),
        activePromotions,
        activeCampaigns
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
      const activePromotions = await db.query(
        'SELECT * FROM promotions WHERE isActive = true'
      );

      for (const promotion of activePromotions) {
        // Count recent redemptions
        const [recentRedemptionsResult] = await db.query(
          'SELECT COUNT(*) as count FROM user_promotions WHERE promotionId = ? AND createdAt >= ?',
          [promotion.id, timeWindowStr]
        );
        
        const recentRedemptions = recentRedemptionsResult?.count || 0;
        const averageHourlyRedemptions = promotion.averageHourlyRedemptions || 1;

        if (recentRedemptions > averageHourlyRedemptions * 3) {
          logSuspiciousActivity({
            type: 'high_redemption_rate',
            promotionId: promotion.id,
            code: promotion.code,
            redemptionCount: recentRedemptions,
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
      const activeCampaigns = await db.query(`
        SELECT 
          pc.*,
          GROUP_CONCAT(p.id) as promotionIds
        FROM 
          promotion_campaigns pc
        LEFT JOIN 
          promotions p ON p.campaign_id = pc.id
        WHERE 
          pc.status = 'active'
        GROUP BY 
          pc.id
      `);

      for (const campaign of activeCampaigns) {
        // Parse promotion IDs
        const promotionIds = campaign.promotionIds ? campaign.promotionIds.split(',') : [];
        
        if (promotionIds.length === 0) continue;
        
        // Calculate total redemptions
        const [redemptionsResult] = await db.query(`
          SELECT 
            SUM(current_redemptions) as totalRedemptions
          FROM 
            promotions
          WHERE 
            id IN (?)
        `, [promotionIds]);
        
        const totalRedemptions = redemptionsResult?.totalRedemptions || 0;

        // Calculate total revenue from orders using these promotions
        const [revenueResult] = await db.query(`
          SELECT 
            SUM(o.totalAmount) as totalRevenue
          FROM 
            orders o
          JOIN 
            user_promotions up ON up.orderId = o.id
          WHERE 
            up.promotionId IN (?)
        `, [promotionIds]);
        
        const totalRevenue = revenueResult?.totalRevenue || 0;
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
        
        await db.query(
          'UPDATE promotion_campaigns SET metrics = ? WHERE id = ?',
          [updatedMetrics, campaign.id]
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
      const suspiciousUsers = await db.query(`
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
      `, [timeWindowStr]);

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
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      // Check for promotions that should be active based on dates
      await db.query(`
        UPDATE promotions 
        SET isActive = true
        WHERE 
          isActive = false AND 
          start_date <= ? AND 
          end_date > ? AND
          (max_redemptions IS NULL OR current_redemptions < max_redemptions)
      `, [now, now]);

      // Check for promotions that should be deactivated
      await db.query(`
        UPDATE promotions 
        SET isActive = false
        WHERE 
          isActive = true AND
          (end_date <= ? OR (max_redemptions IS NOT NULL AND current_redemptions >= max_redemptions))
      `, [now]);
      
      // Log promotions that were updated
      const updatedPromotions = await db.query(`
        SELECT id, code, name, isActive
        FROM promotions
        WHERE last_modified >= DATE_SUB(?, INTERVAL 5 MINUTE)
      `, [now]);

      if (updatedPromotions.length > 0) {
      logPromotionActivity({
          type: 'status_updates',
          count: updatedPromotions.length,
          promotions: updatedPromotions.map(p => ({
            id: p.id,
            code: p.code,
            isActive: p.isActive
          }))
        });
      }
    } catch (error) {
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
      console.log('[PromotionMonitoring] Completed promotion monitoring check.');
    } catch (error) {
      console.error('[PromotionMonitoring] Error:', error);
    }
  }

  async deactivateExpiredPromotions() {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Get expired but still active promotions
    const expiredPromotions = await db.query(
      'SELECT * FROM promotions WHERE isActive = true AND end_date < ?',
      [now]
    );
    
    if (expiredPromotions.length > 0) {
      console.log(`[PromotionMonitoring] Found ${expiredPromotions.length} expired promotions.`);
      
      // Deactivate expired promotions
      await db.query(
        'UPDATE promotions SET isActive = false WHERE end_date < ?',
        [now]
      );
      
      // Log deactivations
      for (const promo of expiredPromotions) {
        console.log(`[PromotionMonitoring] Deactivated expired promotion: ${promo.code} (ID: ${promo.id})`);
        
        // Log the action in the admin activity log
        await db.query(
          'INSERT INTO user_activity_logs (userId, action, details, timestamp) VALUES (?, ?, ?, NOW())',
          [
            1, // Admin user ID
            'system_promotion_expired',
            JSON.stringify({
              promotionId: promo.id,
              code: promo.code,
              name: promo.name,
              endDate: promo.end_date
            })
          ]
        );
      }
    }
  }

  async checkLowRedemptions() {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Get active promotions that are about to expire (in next 48 hours) with low redemption rates
    const lowRedemptionPromotions = await db.query(`
      SELECT 
        p.*,
        (p.current_redemptions / p.max_redemptions) * 100 as redemption_percent
      FROM 
        promotions p
      WHERE 
        p.isActive = true 
        AND p.end_date BETWEEN ? AND DATE_ADD(?, INTERVAL 48 HOUR)
        AND p.max_redemptions > 0
        AND (p.current_redemptions / p.max_redemptions) * 100 < 30
    `, [now, now]);
    
    if (lowRedemptionPromotions.length > 0) {
      console.log(`[PromotionMonitoring] Found ${lowRedemptionPromotions.length} promotions with low redemption rates that are expiring soon.`);
      
      // Log alert for each promotion with low redemptions
      for (const promo of lowRedemptionPromotions) {
        console.log(`[PromotionMonitoring] Low redemption alert: ${promo.code} (${promo.redemption_percent.toFixed(2)}% used, expires ${promo.end_date})`);
        
        // Create notification for admin
        await db.query(
          'INSERT INTO notifications (userId, title, message, type, data, isRead) VALUES (?, ?, ?, ?, ?, false)',
          [
            1, // Admin user ID
            'Low Promotion Usage Alert',
            `Promotion ${promo.code} (${promo.name}) has only ${promo.redemption_percent.toFixed(2)}% redemption and will expire soon.`,
            'promotion_alert',
            JSON.stringify({
              promotionId: promo.id,
              code: promo.code,
              name: promo.name,
              redemptionPercent: promo.redemption_percent,
              endDate: promo.end_date
            })
          ]
        );
      }
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