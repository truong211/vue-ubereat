'use strict';

const { Loyalty, LoyaltyReward, LoyaltyRedemption, User, Restaurant, Order } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// Get or create a user's loyalty account
exports.getUserLoyalty = async (req, res) => {
  try {
    const { userId } = req.params;
    const { restaurantId } = req.query;
    
    let where = { userId };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    let [loyalty, created] = await Loyalty.findOrCreate({
      where,
      defaults: {
        userId,
        restaurantId: restaurantId || null,
        points: 0,
        tier: 'bronze'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: loyalty,
      created
    });
  } catch (error) {
    console.error('Error fetching user loyalty:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user loyalty information',
      error: error.message
    });
  }
};

// Add loyalty points to a user
exports.addPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { restaurantId, points, orderId } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive number'
      });
    }
    
    let where = { userId };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    // Find or create loyalty record
    let [loyalty, created] = await Loyalty.findOrCreate({
      where,
      defaults: {
        userId,
        restaurantId: restaurantId || null,
        points: 0,
        tier: 'bronze'
      }
    });
    
    // Update points
    const newPoints = loyalty.points + points;
    const tier = await calculateTier(newPoints);
    
    await loyalty.update({
      points: newPoints,
      tier,
      lastPointEarned: new Date()
    });
    
    // Fetch updated record with associations
    loyalty = await Loyalty.findOne({
      where: { id: loyalty.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: loyalty,
      message: `Added ${points} points to user's loyalty account`
    });
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add loyalty points',
      error: error.message
    });
  }
};

// Helper function to calculate loyalty tier based on points
const calculateTier = async (points) => {
  if (points >= 1000) {
    return 'platinum';
  } else if (points >= 500) {
    return 'gold';
  } else if (points >= 200) {
    return 'silver';
  } else {
    return 'bronze';
  }
};

// Get available loyalty rewards
exports.getAvailableRewards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { restaurantId } = req.query;
    
    // Get user's loyalty info
    let where = { userId };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    const loyalty = await Loyalty.findOne({ where });
    
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty account not found'
      });
    }
    
    // Get rewards the user can redeem
    const rewardWhere = {
      status: 'active',
      pointsRequired: { [Op.lte]: loyalty.points }
    };
    
    if (restaurantId) {
      rewardWhere.restaurantId = restaurantId;
    }
    
    // Include tier-based filtering
    const tierLevels = {
      bronze: 0,
      silver: 1,
      gold: 2,
      platinum: 3
    };
    
    const userTierLevel = tierLevels[loyalty.tier];
    
    // Get all rewards
    const allRewards = await LoyaltyReward.findAll({
      where: rewardWhere,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Filter by tier
    const availableRewards = allRewards.filter(reward => {
      const rewardTierLevel = tierLevels[reward.tier || 'bronze'];
      return rewardTierLevel <= userTierLevel;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        loyalty,
        availableRewards
      }
    });
  } catch (error) {
    console.error('Error fetching available rewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available rewards',
      error: error.message
    });
  }
};

// Redeem a loyalty reward
exports.redeemReward = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rewardId, orderId } = req.body;
    
    // Get the reward
    const reward = await LoyaltyReward.findByPk(rewardId);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    // Check if the reward is active
    if (reward.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This reward is no longer available'
      });
    }
    
    // Get user's loyalty
    let where = { userId };
    if (reward.restaurantId) {
      where.restaurantId = reward.restaurantId;
    }
    
    const loyalty = await Loyalty.findOne({ where });
    
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty account not found'
      });
    }
    
    // Check if user has enough points
    if (loyalty.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Not enough loyalty points to redeem this reward'
      });
    }
    
    // Create redemption
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Set expiry 30 days from now
    
    const redemption = await LoyaltyRedemption.create({
      userId,
      rewardId,
      pointsSpent: reward.pointsRequired,
      orderId: orderId || null,
      status: 'issued',
      expiryDate
    });
    
    // Deduct points from user's loyalty account
    await loyalty.update({
      points: loyalty.points - reward.pointsRequired
    });
    
    // Get updated loyalty with relationships
    const updatedLoyalty = await Loyalty.findOne({
      where: { id: loyalty.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Get redemption with relationships
    const redemptionWithDetails = await LoyaltyRedemption.findOne({
      where: { id: redemption.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: LoyaltyReward,
          as: 'reward'
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        redemption: redemptionWithDetails,
        loyalty: updatedLoyalty
      },
      message: 'Reward redeemed successfully'
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to redeem reward',
      error: error.message
    });
  }
};

// Get user's redemption history
exports.getRedemptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const redemptions = await LoyaltyRedemption.findAll({
      where: { userId },
      include: [
        {
          model: LoyaltyReward,
          as: 'reward',
          include: [
            {
              model: Restaurant,
              as: 'restaurant',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'total']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: redemptions
    });
  } catch (error) {
    console.error('Error fetching redemption history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch redemption history',
      error: error.message
    });
  }
};

// Create a new loyalty reward
exports.createReward = async (req, res) => {
  try {
    const { 
      restaurantId, 
      name, 
      description, 
      pointsRequired, 
      rewardType, 
      rewardValue,
      tier,
      status 
    } = req.body;
    
    const reward = await LoyaltyReward.create({
      restaurantId,
      name,
      description,
      pointsRequired,
      rewardType,
      rewardValue,
      tier: tier || 'bronze',
      status: status || 'active'
    });
    
    return res.status(201).json({
      success: true,
      data: reward,
      message: 'Loyalty reward created successfully'
    });
  } catch (error) {
    console.error('Error creating loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create loyalty reward',
      error: error.message
    });
  }
};

// Update a loyalty reward
exports.updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      pointsRequired, 
      rewardType, 
      rewardValue,
      tier,
      status 
    } = req.body;
    
    const reward = await LoyaltyReward.findByPk(id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    await reward.update({
      name: name || reward.name,
      description: description !== undefined ? description : reward.description,
      pointsRequired: pointsRequired || reward.pointsRequired,
      rewardType: rewardType || reward.rewardType,
      rewardValue: rewardValue !== undefined ? rewardValue : reward.rewardValue,
      tier: tier || reward.tier,
      status: status || reward.status
    });
    
    return res.status(200).json({
      success: true,
      data: reward,
      message: 'Loyalty reward updated successfully'
    });
  } catch (error) {
    console.error('Error updating loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update loyalty reward',
      error: error.message
    });
  }
};

// Get loyalty program analytics
exports.getLoyaltyAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    let where = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    // Get total users with loyalty accounts
    const totalUsers = await Loyalty.count({ where });
    
    // Get users by tier
    const usersByTier = await Loyalty.findAll({
      where,
      attributes: [
        'tier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tier']
    });
    
    // Get total points issued
    const totalPointsIssued = await Loyalty.sum('points', { where });
    
    // Get total points redeemed
    const totalPointsRedeemed = await LoyaltyRedemption.sum('pointsSpent', {
      include: restaurantId ? [
        {
          model: LoyaltyReward,
          as: 'reward',
          where: { restaurantId }
        }
      ] : []
    });
    
    // Get most popular rewards
    const popularRewards = await LoyaltyRedemption.findAll({
      attributes: [
        'rewardId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'redemptionCount']
      ],
      include: [
        {
          model: LoyaltyReward,
          as: 'reward',
          where: restaurantId ? { restaurantId } : {},
          include: [
            {
              model: Restaurant,
              as: 'restaurant',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      group: ['rewardId', 'reward.id', 'reward.restaurant.id', 'reward.restaurant.name'],
      order: [[sequelize.literal('redemptionCount'), 'DESC']],
      limit: 5
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        usersByTier,
        totalPointsIssued: totalPointsIssued || 0,
        totalPointsRedeemed: totalPointsRedeemed || 0,
        popularRewards
      }
    });
  } catch (error) {
    console.error('Error getting loyalty analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get loyalty analytics',
      error: error.message
    });
  }
}; 