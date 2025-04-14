/**
 * PromotionMonitoring Service
 * Handles scheduled tasks related to promotions
 */
const db = require('../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class PromotionMonitoringService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.checkIntervalMinutes = 30;
  }

  /**
   * Start the promotion monitoring service
   * @param {number} intervalMinutes - How often to check promotions (default: 30 minutes)
   */
  start(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('[PromotionMonitoring] Service is already running');
      return;
    }

    this.checkIntervalMinutes = intervalMinutes;
    const intervalMs = this.checkIntervalMinutes * 60 * 1000;

    // Run once immediately
    this.monitorPromotions();

    // Then set up the interval
    this.intervalId = setInterval(() => {
      this.monitorPromotions();
    }, intervalMs);

    this.isRunning = true;
    console.log(`[PromotionMonitoring] Service started. Checking every ${this.checkIntervalMinutes} minutes`);
  }

  /**
   * Stop the promotion monitoring service
   */
  stop() {
    if (!this.isRunning) {
      console.log('[PromotionMonitoring] Service is not running');
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    console.log('[PromotionMonitoring] Service stopped');
  }

  /**
   * Check if the service is currently running
   * @returns {boolean} - Whether the service is running
   */
  isServiceRunning() {
    return this.isRunning;
  }

  /**
   * Get the current check interval in minutes
   * @returns {number} - The current check interval in minutes
   */
  getCheckInterval() {
    return this.checkIntervalMinutes;
  }

  /**
   * Run the promotion monitoring tasks
   */
  async monitorPromotions() {
    console.log('[PromotionMonitoring] Running scheduled promotion monitoring...');
    
    try {
      // Task 1: Deactivate expired promotions
      await this.deactivateExpiredPromotions();
      
      // Task 2: Notify about low redemption promotions that will expire soon
      await this.notifyLowRedemptionPromotions();
      
      console.log('[PromotionMonitoring] Completed promotion monitoring check.');
    } catch (error) {
      console.error('[PromotionMonitoring] Error:', error);
    }
  }

  /**
   * Deactivate promotions that have expired
   */
  async deactivateExpiredPromotions() {
    const now = new Date();
    
    try {
      // Find expired promotions that are still active
      const expiredPromotions = await db.Promotion.findAll({
        where: {
          isActive: true,
          endDate: {
            [Op.lt]: now
          }
        }
      });
      
      if (expiredPromotions.length === 0) {
        return;
      }
      
      console.log(`[PromotionMonitoring] Found ${expiredPromotions.length} expired promotions to deactivate.`);
      
      // Update the promotions to be inactive
      await db.Promotion.update(
        { isActive: false },
        {
          where: {
            id: {
              [Op.in]: expiredPromotions.map(p => p.id)
            }
          }
        }
      );
      
      // Log the deactivated promotions
      expiredPromotions.forEach(promo => {
        console.log(`[PromotionMonitoring] Deactivated expired promotion: ${promo.code} (${promo.title})`);
      });
      
      // Optionally, create a system notification about the deactivated promotions
      if (expiredPromotions.length > 0 && db.Notification) {
        await db.Notification.create({
          title: 'Promotions Expired',
          content: `${expiredPromotions.length} promotions have been automatically deactivated.`,
          type: 'system',
          isSystemWide: true,
          data: {
            promotionIds: expiredPromotions.map(p => p.id),
            promotionCodes: expiredPromotions.map(p => p.code)
          }
        });
      }
    } catch (error) {
      console.error('[PromotionMonitoring] Error deactivating expired promotions:', error);
      throw error;
    }
  }

  /**
   * Notify about promotions with low redemption rates that will expire soon
   */
  async notifyLowRedemptionPromotions() {
    const now = new Date();
    // Check promotions expiring in the next 48 hours
    const twoDaysLater = new Date(now);
    twoDaysLater.setHours(twoDaysLater.getHours() + 48);
    
    try {
      // Find promotions that are:
      // 1. Active
      // 2. Expiring in the next 48 hours
      // 3. Have a usage limit > 0
      // 4. Have a redemption rate < 30%
      const lowRedemptionPromotions = await db.sequelize.query(`
      SELECT
        p.*,
        (p.currentUsage / p.usageLimit) * 100 as redemption_percent
      FROM
        promotions p
      WHERE
        p.isActive = true
        AND p.endDate BETWEEN :now AND :twoDaysLater
        AND p.usageLimit > 0
        AND (p.currentUsage / p.usageLimit) * 100 < 30
      `, {
        replacements: { now, twoDaysLater },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (lowRedemptionPromotions.length === 0) {
        return;
      }
      
      console.log(`[PromotionMonitoring] Found ${lowRedemptionPromotions.length} promotions with low redemption rates expiring soon.`);
      
      // Optionally, create a system notification for each promotion
      if (db.Notification) {
        for (const promo of lowRedemptionPromotions) {
          await db.Notification.create({
            title: 'Low Redemption Promotion Expiring Soon',
            content: `Promotion "${promo.title}" (${promo.code}) has a low redemption rate (${Math.round(promo.redemption_percent)}%) and will expire on ${new Date(promo.endDate).toLocaleDateString()}.`,
            type: 'promotion',
            isSystemWide: true,
            data: {
              promotionId: promo.id,
              promotionCode: promo.code,
              redemptionRate: promo.redemption_percent,
              expiryDate: promo.endDate
            }
          });
        }
      }
    } catch (error) {
      console.error('[PromotionMonitoring] Error checking low redemption promotions:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const promotionMonitoring = new PromotionMonitoringService();
module.exports = promotionMonitoring;
