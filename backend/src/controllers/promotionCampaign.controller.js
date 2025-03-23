const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  PromotionCampaign, 
  PromotionCategory, 
  Promotion, 
  UserPromotion 
} = require('../models');
const { AppError } = require('../middleware/error.middleware');

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await PromotionCategory.create({ name, description });
    res.status(201).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await PromotionCategory.findAll({
      where: { active: true },
      include: [
        {
          model: PromotionCampaign,
          as: 'campaigns',
          attributes: ['id', 'name', 'status']
        }
      ]
    });
    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      categoryId,
      budget,
      targetAudience
    } = req.body;

    const campaign = await PromotionCampaign.create({
      name,
      description,
      startDate,
      endDate,
      categoryId,
      budget,
      targetAudience,
      status: startDate <= new Date() ? 'active' : 'scheduled'
    });

    res.status(201).json({
      status: 'success',
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const { status, categoryId } = req.query;
    const where = {};
    
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const campaigns = await PromotionCampaign.findAll({
      where,
      include: [
        {
          model: PromotionCategory,
          as: 'category'
        },
        {
          model: Promotion,
          as: 'promotions',
          attributes: ['id', 'code', 'status', 'currentRedemptions']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: { campaigns }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCampaignStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeRange = 30 } = req.query;

    const campaign = await PromotionCampaign.findByPk(id, {
      include: [
        {
          model: Promotion,
          as: 'promotions',
          attributes: ['id', 'code', 'currentRedemptions', 'totalDiscountAmount', 'totalOrderValue']
        }
      ]
    });

    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Get usage statistics for all promotions in the campaign
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const promotionIds = campaign.promotions.map(p => p.id);
    const usageStats = await UserPromotion.findAll({
      where: {
        promotionId: { [Op.in]: promotionIds },
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['code']
        }
      ]
    });

    // Calculate daily stats for each promotion
    const dailyStats = {};
    usageStats.forEach(usage => {
      const date = usage.createdAt.toISOString().split('T')[0];
      const promoCode = usage.promotion.code;
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          totalRedemptions: 0,
          totalDiscount: 0,
          totalOrderValue: 0,
          byPromotion: {}
        };
      }
      
      if (!dailyStats[date].byPromotion[promoCode]) {
        dailyStats[date].byPromotion[promoCode] = {
          redemptions: 0,
          discount: 0,
          orderValue: 0
        };
      }

      dailyStats[date].totalRedemptions++;
      dailyStats[date].totalDiscount += parseFloat(usage.discountAmount);
      dailyStats[date].totalOrderValue += parseFloat(usage.orderTotal);

      dailyStats[date].byPromotion[promoCode].redemptions++;
      dailyStats[date].byPromotion[promoCode].discount += parseFloat(usage.discountAmount);
      dailyStats[date].byPromotion[promoCode].orderValue += parseFloat(usage.orderTotal);
    });

    // Calculate campaign-level metrics
    const metrics = {
      totalRedemptions: campaign.promotions.reduce((sum, p) => sum + p.currentRedemptions, 0),
      totalDiscountAmount: campaign.promotions.reduce((sum, p) => sum + parseFloat(p.totalDiscountAmount), 0),
      totalOrderValue: campaign.promotions.reduce((sum, p) => sum + parseFloat(p.totalOrderValue), 0),
      spentBudget: campaign.spentAmount,
      remainingBudget: campaign.budget ? parseFloat(campaign.budget) - parseFloat(campaign.spentAmount) : null,
      budgetUtilization: campaign.budget ? (parseFloat(campaign.spentAmount) / parseFloat(campaign.budget) * 100) : null,
      timeAnalytics: Object.keys(dailyStats).map(date => ({
        date,
        ...dailyStats[date]
      }))
    };

    res.status(200).json({
      status: 'success',
      data: {
        campaign: {
          ...campaign.toJSON(),
          metrics
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const campaign = await PromotionCampaign.findByPk(id);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Validate status transition
    const validTransitions = {
      draft: ['scheduled', 'active', 'cancelled'],
      scheduled: ['active', 'cancelled'],
      active: ['paused', 'completed'],
      paused: ['active', 'completed'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[campaign.status].includes(status)) {
      return next(new AppError(`Invalid status transition from ${campaign.status} to ${status}`, 400));
    }

    // Update campaign status
    await campaign.update({ status });

    // If activating or pausing, update all associated promotions
    if (status === 'active' || status === 'paused') {
      await Promotion.update(
        { status: status === 'active' ? 'active' : 'paused' },
        { where: { campaignId: id } }
      );
    }

    res.status(200).json({
      status: 'success',
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const campaign = await PromotionCampaign.findByPk(id);
    if (!campaign) {
      return next(new AppError('Campaign not found', 404));
    }

    // Don't allow changing certain fields if campaign is active
    if (campaign.status === 'active') {
      delete updateData.startDate;
      delete updateData.endDate;
      delete updateData.budget;
    }

    await campaign.update(updateData);

    res.status(200).json({
      status: 'success',
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};