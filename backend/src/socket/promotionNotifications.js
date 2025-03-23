const { PromotionCampaign, Promotion } = require('../models');

class PromotionNotifications {
  constructor(io) {
    this.io = io;
  }

  // Monitor promotion usage and send notifications
  async monitorPromotionUsage(promotionId) {
    const promotion = await Promotion.findByPk(promotionId);
    if (!promotion) return;

    // Check usage limits
    if (promotion.maxRedemptions) {
      const usagePercentage = (promotion.currentRedemptions / promotion.maxRedemptions) * 100;
      
      if (usagePercentage >= 90) {
        this.notifyAdmin('promotion_alert', {
          type: 'usage_limit',
          promotionId: promotion.id,
          code: promotion.code,
          message: `Promotion ${promotion.code} has reached ${usagePercentage}% of its usage limit`
        });
      }
    }

    // If part of a campaign, check campaign budget
    if (promotion.campaignId) {
      const campaign = await PromotionCampaign.findByPk(promotion.campaignId);
      if (campaign && campaign.budget) {
        const budgetUsage = (campaign.spentAmount / campaign.budget) * 100;
        
        if (budgetUsage >= 90) {
          this.notifyAdmin('campaign_alert', {
            type: 'budget_limit',
            campaignId: campaign.id,
            name: campaign.name,
            message: `Campaign "${campaign.name}" has used ${budgetUsage}% of its budget`
          });

          // Auto-pause campaign if over budget
          if (budgetUsage >= 100) {
            await this.pauseCampaign(campaign.id);
          }
        }
      }
    }
  }

  // Auto-pause campaign and its promotions
  async pauseCampaign(campaignId) {
    const campaign = await PromotionCampaign.findByPk(campaignId);
    if (!campaign) return;

    await campaign.update({ status: 'paused' });
    
    // Pause all promotions in the campaign
    await Promotion.update(
      { status: 'paused' },
      { where: { campaignId } }
    );

    this.notifyAdmin('campaign_alert', {
      type: 'auto_paused',
      campaignId: campaign.id,
      name: campaign.name,
      message: `Campaign "${campaign.name}" has been automatically paused due to reaching budget limit`
    });
  }

  // Send notification to admin dashboard
  notifyAdmin(event, data) {
    this.io.to('admin').emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Handle expired promotions
  async handleExpiredPromotions() {
    const now = new Date();
    
    // Find expired promotions
    const expiredPromotions = await Promotion.findAll({
      where: {
        status: 'active',
        endDate: { [Op.lt]: now }
      }
    });

    // Update status and notify
    for (const promotion of expiredPromotions) {
      await promotion.update({ status: 'expired' });
      
      this.notifyAdmin('promotion_alert', {
        type: 'expired',
        promotionId: promotion.id,
        code: promotion.code,
        message: `Promotion ${promotion.code} has expired`
      });
    }
  }

  // Initialize scheduled tasks
  initScheduledTasks() {
    // Check for expired promotions every hour
    setInterval(() => {
      this.handleExpiredPromotions();
    }, 60 * 60 * 1000);
  }
}

module.exports = PromotionNotifications;