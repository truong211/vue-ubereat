'use strict';

const db = require('../models');
const Loyalty = db.Loyalty;
const LoyaltyReward = db.LoyaltyReward;
const LoyaltyRedemption = db.LoyaltyRedemption;
const LoyaltyActivity = db.LoyaltyActivity; // New model for tracking activities
const LoyaltyReferral = db.LoyaltyReferral; // New model for tracking referrals
const User = db.User;
const Restaurant = db.Restaurant;
const Order = db.Order;
const { Op } = require('sequelize');
const sequelize = db.sequelize;
const moment = require('moment');
const logger = require('../utils/logger');

// Get a user's loyalty status with enhanced details
exports.getUserLoyalty = async (req, res) => {
  try {
    const { userId, restaurantId } = req.params;
    
    const where = { userId };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    const loyalty = await Loyalty.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty record not found'
      });
    }
    
    // Get available rewards for this user
    const rewards = await LoyaltyReward.findAll({
      where: {
        [Op.or]: [
          { restaurantId: restaurantId || null },
          { restaurantId: null }
        ],
        status: 'active',
        [Op.or]: [
          { tier: loyalty.tier },
          { tier: 'all' }
        ]
      }
    });
    
    // Get recent redemptions
    const redemptions = await LoyaltyRedemption.findAll({
      where: { userId },
      include: [
        {
          model: LoyaltyReward,
          as: 'reward',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    // Get expiring points information
    const expiringPoints = await LoyaltyActivity.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('points')), 'pointsExpiring'],
        'expiryDate'
      ],
      where: {
        userId,
        expiryDate: {
          [Op.not]: null,
          [Op.gt]: new Date()
        },
        expiryDate: {
          [Op.lte]: moment().add(30, 'days').toDate()
        }
      },
      group: ['expiryDate'],
      order: [['expiryDate', 'ASC']]
    });
    
    // Get milestone progress
    const milestoneProgress = await getProgressToNextTier(loyalty);
    
    // Get recent activity history
    const activityHistory = await LoyaltyActivity.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Get successful referrals
    const successfulReferrals = await LoyaltyReferral.count({
      where: {
        referrerId: userId,
        status: 'completed'
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        loyalty,
        availableRewards: rewards,
        recentRedemptions: redemptions,
        expiringPoints,
        milestoneProgress,
        activityHistory,
        successfulReferrals
      }
    });
  } catch (error) {
    logger.error('Error getting user loyalty:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user loyalty',
      error: error.message
    });
  }
};

// Helper function to get progress to next tier
async function getProgressToNextTier(loyalty) {
  const currentPoints = loyalty.points;
  let nextTierThreshold;
  let nextTier;
  
  if (loyalty.tier === 'bronze') {
    nextTierThreshold = 200;
    nextTier = 'silver';
  } else if (loyalty.tier === 'silver') {
    nextTierThreshold = 500;
    nextTier = 'gold';
  } else if (loyalty.tier === 'gold') {
    nextTierThreshold = 1000;
    nextTier = 'platinum';
  } else {
    // Already at platinum, show progress to custom VIP status
    nextTierThreshold = 2000;
    nextTier = 'vip';
  }
  
  const pointsNeeded = Math.max(0, nextTierThreshold - currentPoints);
  const percentComplete = Math.min(100, (currentPoints / nextTierThreshold) * 100);
  
  return {
    currentTier: loyalty.tier,
    nextTier,
    currentPoints,
    nextTierThreshold,
    pointsNeeded,
    percentComplete
  };
}

// Create or update a user's loyalty with enhanced tracking
exports.updateUserLoyalty = async (req, res) => {
  try {
    const { userId, restaurantId, points, action, source, orderId, expiryDays } = req.body;
    
    if (!userId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'User ID and points are required'
      });
    }
    
    const where = { userId };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    // Find or create loyalty record
    let [loyalty, created] = await Loyalty.findOrCreate({
      where,
      defaults: {
        userId,
        restaurantId: restaurantId || null,
        points: Math.max(0, points),
        tier: 'bronze',
        lastPointEarned: new Date(),
        pointsLifetime: Math.max(0, points)
      }
    });
    
    if (!created) {
      // Update existing record
      let newPoints;
      let pointsChange = 0;
      
      if (action === 'add') {
        // Add points
        newPoints = loyalty.points + points;
        pointsChange = points;
      } else if (action === 'subtract') {
        // Subtract points, but don't go below 0
        newPoints = Math.max(0, loyalty.points - points);
        pointsChange = -points;
      } else if (action === 'set') {
        // Set to specific value
        pointsChange = points - loyalty.points;
        newPoints = Math.max(0, points);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "add", "subtract", or "set".'
        });
      }
      
      // Calculate new lifetime points
      const newLifetimePoints = action !== 'subtract' 
        ? loyalty.pointsLifetime + Math.max(0, pointsChange) 
        : loyalty.pointsLifetime;
      
      // Update tier based on points with more tiers
      let newTier = calculateTier(newPoints);
      
      // Check if tier has upgraded
      const tierUpgraded = getTierRank(newTier) > getTierRank(loyalty.tier);
      
      await loyalty.update({
        points: newPoints,
        tier: newTier,
        lastPointEarned: action !== 'subtract' ? new Date() : loyalty.lastPointEarned,
        pointsLifetime: newLifetimePoints
      });
      
      // Record the activity
      if (pointsChange !== 0) {
        // Calculate expiry date if applicable
        let expiryDate = null;
        if (expiryDays && pointsChange > 0) {
          expiryDate = moment().add(expiryDays, 'days').toDate();
        }
        
        await LoyaltyActivity.create({
          userId,
          restaurantId: restaurantId || null,
          points: pointsChange,
          activityType: action === 'add' ? 'earned' : 'redeemed',
          source: source || 'manual',
          orderId,
          expiryDate,
          balance: newPoints
        });
      }
      
      // If tier upgraded, create a special activity record
      if (tierUpgraded) {
        await LoyaltyActivity.create({
          userId,
          restaurantId: restaurantId || null,
          points: 0,
          activityType: 'tier_upgrade',
          source: 'system',
          description: `Upgraded to ${newTier} tier`,
          balance: newPoints
        });
        
        // Check for tier upgrade rewards and add them automatically
        await processTierUpgradeRewards(userId, newTier, restaurantId);
      }
      
      // Refetch the updated record
      loyalty = await Loyalty.findOne({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName']
          },
          {
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name']
          }
        ]
      });
    }
    
    return res.status(created ? 201 : 200).json({
      success: true,
      data: loyalty,
      message: created ? 'Loyalty record created' : 'Loyalty points updated'
    });
  } catch (error) {
    logger.error('Error updating user loyalty:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user loyalty',
      error: error.message
    });
  }
};

// Helper function to calculate tier based on points
function calculateTier(points) {
  if (points >= 2000) {
    return 'vip';
  } else if (points >= 1000) {
    return 'platinum';
  } else if (points >= 500) {
    return 'gold';
  } else if (points >= 200) {
    return 'silver';
  } else {
    return 'bronze';
  }
}

// Helper function to get tier rank
function getTierRank(tier) {
  const ranks = {
    'bronze': 1,
    'silver': 2,
    'gold': 3,
    'platinum': 4,
    'vip': 5
  };
  return ranks[tier] || 0;
}

// Process tier upgrade rewards
async function processTierUpgradeRewards(userId, newTier, restaurantId) {
  try {
    // Find any tier upgrade rewards
    const rewards = await LoyaltyReward.findAll({
      where: {
        rewardType: 'tier_upgrade',
        tier: newTier,
        [Op.or]: [
          { restaurantId: restaurantId || null },
          { restaurantId: null }
        ],
        status: 'active'
      }
    });
    
    for (const reward of rewards) {
      // Create redemption record - automatically redeemed
      await LoyaltyRedemption.create({
        userId,
        rewardId: reward.id,
        pointsSpent: 0, // No points spent for tier upgrades
        status: 'issued',
        expiryDate: moment().add(30, 'days').toDate(),
        autoRedeemed: true
      });
      
      // Record the activity
      await LoyaltyActivity.create({
        userId,
        restaurantId: reward.restaurantId || null,
        points: 0,
        activityType: 'tier_reward',
        source: 'system',
        description: `Received ${reward.name} for reaching ${newTier} tier`
      });
    }
    
    return true;
  } catch (error) {
    logger.error('Error processing tier upgrade rewards:', error);
    return false;
  }
}

// Manage loyalty rewards
// Create loyalty reward with enhanced options
exports.createReward = async (req, res) => {
  try {
    const reward = await LoyaltyReward.create({
      restaurantId: req.body.restaurantId,
      name: req.body.name,
      description: req.body.description,
      pointsRequired: req.body.pointsRequired,
      rewardType: req.body.rewardType,
      rewardValue: req.body.rewardValue,
      tier: req.body.tier || 'all',
      status: req.body.status || 'active',
      validFrom: req.body.validFrom || new Date(),
      validUntil: req.body.validUntil,
      imageUrl: req.body.imageUrl,
      maxRedemptionsPerUser: req.body.maxRedemptionsPerUser || null,
      totalAvailable: req.body.totalAvailable || null,
      autoApply: req.body.autoApply || false,
      termsAndConditions: req.body.termsAndConditions
    });
    
    return res.status(201).json({
      success: true,
      data: reward,
      message: 'Loyalty reward created successfully'
    });
  } catch (error) {
    logger.error('Error creating loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create loyalty reward',
      error: error.message
    });
  }
};

// Process loyalty points for orders
exports.processOrderPoints = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Get the order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user'
        },
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Points can only be awarded for delivered orders'
      });
    }
    
    // Check if points have already been processed
    const existingActivity = await LoyaltyActivity.findOne({
      where: {
        orderId,
        activityType: 'earned',
        source: 'order'
      }
    });
    
    if (existingActivity) {
      return res.status(400).json({
        success: false,
        message: 'Points have already been processed for this order'
      });
    }
    
    // Calculate points (e.g., 1 point per $1 spent)
    // You can customize this formula based on your business rules
    const pointsEarned = Math.floor(order.totalAmount);
    
    // Apply any bonuses (e.g., for promotions, VIP status, etc.)
    let bonusPoints = 0;
    let bonusReason = '';
    
    // Get the user's loyalty tier
    const loyalty = await Loyalty.findOne({
      where: {
        userId: order.userId,
        restaurantId: order.restaurantId
      }
    });
    
    // Apply tier bonuses
    if (loyalty) {
      if (loyalty.tier === 'silver') {
        bonusPoints += Math.floor(pointsEarned * 0.1); // 10% bonus
        bonusReason = '10% Silver tier bonus';
      } else if (loyalty.tier === 'gold') {
        bonusPoints += Math.floor(pointsEarned * 0.15); // 15% bonus
        bonusReason = '15% Gold tier bonus';
      } else if (loyalty.tier === 'platinum') {
        bonusPoints += Math.floor(pointsEarned * 0.25); // 25% bonus
        bonusReason = '25% Platinum tier bonus';
      } else if (loyalty.tier === 'vip') {
        bonusPoints += Math.floor(pointsEarned * 0.50); // 50% bonus
        bonusReason = '50% VIP tier bonus';
      }
    }
    
    // Apply any first-time customer bonus
    const orderCount = await Order.count({
      where: {
        userId: order.userId,
        restaurantId: order.restaurantId
      }
    });
    
    if (orderCount === 1) {
      bonusPoints += 50; // First-time customer bonus
      bonusReason += bonusReason ? ' + First-time customer bonus' : 'First-time customer bonus';
    }
    
    // Add the points to the user's loyalty balance
    await exports.updateUserLoyalty({
      body: {
        userId: order.userId,
        restaurantId: order.restaurantId,
        points: pointsEarned + bonusPoints,
        action: 'add',
        source: 'order',
        orderId,
        expiryDays: 365 // Points expire in a year
      }
    }, { status: () => ({ json: () => ({}) }) }); // Mock response object
    
    // Create bonus activity if there are bonus points
    if (bonusPoints > 0) {
      await LoyaltyActivity.create({
        userId: order.userId,
        restaurantId: order.restaurantId,
        points: bonusPoints,
        activityType: 'bonus',
        source: 'system',
        orderId,
        description: bonusReason,
        expiryDate: moment().add(365, 'days').toDate()
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        userId: order.userId,
        orderId,
        basePoints: pointsEarned,
        bonusPoints,
        totalPoints: pointsEarned + bonusPoints,
        bonusReason
      },
      message: 'Loyalty points processed successfully'
    });
  } catch (error) {
    logger.error('Error processing order points:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process loyalty points',
      error: error.message
    });
  }
};

// Create a referral
exports.createReferral = async (req, res) => {
  try {
    const { referrerId, referralEmail, restaurantId } = req.body;
    
    if (!referrerId || !referralEmail) {
      return res.status(400).json({
        success: false,
        message: 'Referrer ID and referral email are required'
      });
    }
    
    // Check if the referrer exists
    const referrer = await User.findByPk(referrerId);
    
    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Referrer not found'
      });
    }
    
    // Check if this email has already been referred
    const existingReferral = await LoyaltyReferral.findOne({
      where: {
        referrerEmail: referralEmail
      }
    });
    
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: 'This email has already been referred'
      });
    }
    
    // Generate a unique referral code
    const referralCode = generateReferralCode(referrerId, referralEmail);
    
    // Create the referral
    const referral = await LoyaltyReferral.create({
      referrerId,
      referrerEmail: referralEmail,
      restaurantId,
      referralCode,
      status: 'pending',
      expiryDate: moment().add(30, 'days').toDate()
    });
    
    return res.status(201).json({
      success: true,
      data: {
        referral,
        referralLink: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`
      },
      message: 'Referral created successfully'
    });
  } catch (error) {
    logger.error('Error creating referral:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create referral',
      error: error.message
    });
  }
};

// Process a referral completion
exports.processReferral = async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    if (!referralCode || !newUserId) {
      return res.status(400).json({
        success: false,
        message: 'Referral code and new user ID are required'
      });
    }
    
    // Find the referral
    const referral = await LoyaltyReferral.findOne({
      where: {
        referralCode,
        status: 'pending'
      }
    });
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Valid referral not found'
      });
    }
    
    // Check if the referral has expired
    if (referral.expiryDate && moment(referral.expiryDate).isBefore(moment())) {
      return res.status(400).json({
        success: false,
        message: 'Referral has expired'
      });
    }
    
    // Update the referral
    await referral.update({
      referredUserId: newUserId,
      status: 'completed',
      completedAt: new Date()
    });
    
    // Award points to the referrer (200 points)
    await exports.updateUserLoyalty({
      body: {
        userId: referral.referrerId,
        restaurantId: referral.restaurantId,
        points: 200,
        action: 'add',
        source: 'referral',
        expiryDays: 365
      }
    }, { status: () => ({ json: () => ({}) }) }); // Mock response object
    
    // Record the activity
    await LoyaltyActivity.create({
      userId: referral.referrerId,
      restaurantId: referral.restaurantId,
      points: 200,
      activityType: 'earned',
      source: 'referral',
      description: 'Successful referral bonus',
      expiryDate: moment().add(365, 'days').toDate()
    });
    
    // Award points to the new user (100 points)
    await exports.updateUserLoyalty({
      body: {
        userId: newUserId,
        restaurantId: referral.restaurantId,
        points: 100,
        action: 'add',
        source: 'referral',
        expiryDays: 365
      }
    }, { status: () => ({ json: () => ({}) }) }); // Mock response object
    
    // Record the activity for the new user
    await LoyaltyActivity.create({
      userId: newUserId,
      restaurantId: referral.restaurantId,
      points: 100,
      activityType: 'earned',
      source: 'referral',
      description: 'Signup referral bonus',
      expiryDate: moment().add(365, 'days').toDate()
    });
    
    return res.status(200).json({
      success: true,
      data: {
        referral,
        referrerPoints: 200,
        referredPoints: 100
      },
      message: 'Referral processed successfully'
    });
  } catch (error) {
    logger.error('Error processing referral:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process referral',
      error: error.message
    });
  }
};

// Generate a unique referral code
function generateReferralCode(referrerId, email) {
  const baseString = `${referrerId}-${email}-${Date.now()}`;
  const hash = require('crypto').createHash('md5').update(baseString).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

// Get loyalty analytics for restaurants or admin
exports.getLoyaltyAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Build date range filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Build restaurant filter
    const restaurantFilter = restaurantId ? { restaurantId } : {};
    
    // Points earned by source
    const pointsEarnedBySource = await LoyaltyActivity.findAll({
      attributes: [
        'source',
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        ...dateFilter,
        ...restaurantFilter,
        activityType: 'earned',
        points: { [Op.gt]: 0 }
      },
      group: ['source']
    });
    
    // Points redeemed by type
    const pointsRedeemedByType = await LoyaltyActivity.findAll({
      attributes: [
        'source',
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        ...dateFilter,
        ...restaurantFilter,
        activityType: 'redeemed',
        points: { [Op.lt]: 0 }
      },
      group: ['source']
    });
    
    // Popular rewards
    const popularRewards = await LoyaltyRedemption.findAll({
      attributes: [
        'rewardId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'redemptionCount']
      ],
      include: [
        {
          model: LoyaltyReward,
          as: 'reward',
          attributes: ['name', 'pointsRequired', 'rewardType']
        }
      ],
      where: {
        ...dateFilter,
        status: 'redeemed'
      },
      group: ['rewardId'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });
    
    // Tier distribution
    const tierDistribution = await Loyalty.findAll({
      attributes: [
        'tier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'userCount']
      ],
      where: restaurantFilter,
      group: ['tier']
    });
    
    // Active vs inactive users
    const activeUsers = await Loyalty.count({
      where: {
        ...restaurantFilter,
        lastPointEarned: {
          [Op.gte]: moment().subtract(90, 'days').toDate()
        }
      }
    });
    
    const totalUsers = await Loyalty.count({
      where: restaurantFilter
    });
    
    return res.status(200).json({
      success: true,
      data: {
        pointsEarnedBySource,
        pointsRedeemedByType,
        popularRewards,
        tierDistribution,
        userEngagement: {
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalUsers,
          activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
        }
      }
    });
  } catch (error) {
    logger.error('Error getting loyalty analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get loyalty analytics',
      error: error.message
    });
  }
};

// Process expiring points
exports.checkExpiringPoints = async () => {
  try {
    // Get all loyalty activities with expiry dates
    const expiringActivities = await LoyaltyActivity.findAll({
      where: {
        expiryDate: {
          [Op.lt]: new Date()
        },
        processed: false,
        points: { [Op.gt]: 0 }
      }
    });
    
    for (const activity of expiringActivities) {
      // Get current loyalty
      const loyalty = await Loyalty.findOne({
        where: {
          userId: activity.userId,
          restaurantId: activity.restaurantId || null
        }
      });
      
      if (loyalty) {
        // Deduct the expired points
        const newPoints = Math.max(0, loyalty.points - activity.points);
        
        await loyalty.update({
          points: newPoints
        });
        
        // Record the deduction
        await LoyaltyActivity.create({
          userId: activity.userId,
          restaurantId: activity.restaurantId,
          points: -activity.points,
          activityType: 'expired',
          source: 'system',
          description: 'Points expired',
          balance: newPoints
        });
        
        // Mark the original activity as processed
        await activity.update({
          processed: true
        });
        
        // Send notification if applicable
        // This would integrate with your notification system
      }
    }
    
    logger.info(`Processed ${expiringActivities.length} expiring point activities`);
    return true;
  } catch (error) {
    logger.error('Error processing expiring points:', error);
    return false;
  }
};

// Redeem a reward with enhanced validation and tracking
exports.redeemReward = async (req, res) => {
  try {
    const { userId, rewardId, orderId } = req.body;
    
    if (!userId || !rewardId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and reward ID are required'
      });
    }
    
    // Get the reward
    const reward = await LoyaltyReward.findByPk(rewardId);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty reward not found'
      });
    }
    
    if (reward.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This reward is not currently active'
      });
    }
    
    // Check if reward is within valid date range
    const now = new Date();
    if (reward.validFrom && new Date(reward.validFrom) > now) {
      return res.status(400).json({
        success: false,
        message: 'This reward is not yet available'
      });
    }
    
    if (reward.validUntil && new Date(reward.validUntil) < now) {
      return res.status(400).json({
        success: false,
        message: 'This reward has expired'
      });
    }
    
    // Check if total available limit is reached
    if (reward.totalAvailable !== null) {
      const redemptionCount = await LoyaltyRedemption.count({
        where: {
          rewardId
        }
      });
      
      if (redemptionCount >= reward.totalAvailable) {
        return res.status(400).json({
          success: false,
          message: 'This reward is no longer available (limit reached)'
        });
      }
    }
    
    // Check if user has reached their personal redemption limit
    if (reward.maxRedemptionsPerUser !== null) {
      const userRedemptionCount = await LoyaltyRedemption.count({
        where: {
          userId,
          rewardId
        }
      });
      
      if (userRedemptionCount >= reward.maxRedemptionsPerUser) {
        return res.status(400).json({
          success: false,
          message: `You have already redeemed this reward ${reward.maxRedemptionsPerUser} times (maximum allowed)`
        });
      }
    }
    
    // Get user loyalty
    const where = { userId };
    if (reward.restaurantId) {
      where.restaurantId = reward.restaurantId;
    }
    
    const loyalty = await Loyalty.findOne({ where });
    
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty record not found for this user'
      });
    }
    
    // Check if user has enough points
    if (loyalty.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Not enough loyalty points to redeem this reward'
      });
    }
    
    // Check if user has required tier
    if (reward.tier !== 'all' && reward.tier !== loyalty.tier && getTierRank(loyalty.tier) < getTierRank(reward.tier)) {
      return res.status(400).json({
        success: false,
        message: `This reward is only available for ${reward.tier} tier customers or higher`
      });
    }
    
    // Create redemption record
    const redemption = await LoyaltyRedemption.create({
      userId,
      rewardId,
      pointsSpent: reward.pointsRequired,
      orderId: orderId || null,
      status: 'redeemed',
      expiryDate: moment().add(30, 'days').toDate()
    });
    
    // Subtract points from user's loyalty
    await loyalty.update({
      points: loyalty.points - reward.pointsRequired
    });
    
    // Record the activity
    await LoyaltyActivity.create({
      userId,
      restaurantId: reward.restaurantId,
      points: -reward.pointsRequired,
      activityType: 'redeemed',
      source: 'reward',
      description: `Redeemed ${reward.name}`,
      balance: loyalty.points - reward.pointsRequired
    });
    
    // Get the updated loyalty record
    const updatedLoyalty = await Loyalty.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      data: {
        redemption,
        loyalty: updatedLoyalty,
        reward
      },
      message: 'Reward redeemed successfully'
    });
  } catch (error) {
    logger.error('Error redeeming loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to redeem loyalty reward',
      error: error.message
    });
  }
};

// Get all rewards
exports.getAllRewards = async (req, res) => {
  try {
    const { restaurantId, status, tier, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    // Apply filters
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (tier) {
      where.tier = tier;
    }
    
    const { count, rows } = await LoyaltyReward.findAndCountAll({
      where,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        rewards: rows
      }
    });
  } catch (error) {
    logger.error('Error getting loyalty rewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get loyalty rewards',
      error: error.message
    });
  }
};

// Get reward by ID
exports.getRewardById = async (req, res) => {
  try {
    const reward = await LoyaltyReward.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty reward not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    logger.error('Error getting loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get loyalty reward',
      error: error.message
    });
  }
};

// Update reward
exports.updateReward = async (req, res) => {
  try {
    const reward = await LoyaltyReward.findByPk(req.params.id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty reward not found'
      });
    }
    
    await reward.update({
      name: req.body.name !== undefined ? req.body.name : reward.name,
      description: req.body.description !== undefined ? req.body.description : reward.description,
      pointsRequired: req.body.pointsRequired !== undefined ? req.body.pointsRequired : reward.pointsRequired,
      rewardType: req.body.rewardType || reward.rewardType,
      rewardValue: req.body.rewardValue !== undefined ? req.body.rewardValue : reward.rewardValue,
      tier: req.body.tier || reward.tier,
      status: req.body.status || reward.status,
      validFrom: req.body.validFrom || reward.validFrom,
      validUntil: req.body.validUntil || reward.validUntil,
      imageUrl: req.body.imageUrl || reward.imageUrl,
      maxRedemptionsPerUser: req.body.maxRedemptionsPerUser !== undefined ? req.body.maxRedemptionsPerUser : reward.maxRedemptionsPerUser,
      totalAvailable: req.body.totalAvailable !== undefined ? req.body.totalAvailable : reward.totalAvailable,
      autoApply: req.body.autoApply !== undefined ? req.body.autoApply : reward.autoApply,
      termsAndConditions: req.body.termsAndConditions || reward.termsAndConditions
    });
    
    const updatedReward = await LoyaltyReward.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: updatedReward,
      message: 'Loyalty reward updated successfully'
    });
  } catch (error) {
    logger.error('Error updating loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update loyalty reward',
      error: error.message
    });
  }
};

// Delete reward
exports.deleteReward = async (req, res) => {
  try {
    const reward = await LoyaltyReward.findByPk(req.params.id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty reward not found'
      });
    }
    
    await reward.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Loyalty reward deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete loyalty reward',
      error: error.message
    });
  }
};