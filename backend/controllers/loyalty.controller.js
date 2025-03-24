'use strict';

const db = require('../models');
const Loyalty = db.Loyalty;
const LoyaltyReward = db.LoyaltyReward;
const LoyaltyRedemption = db.LoyaltyRedemption;
const User = db.User;
const Restaurant = db.Restaurant;
const { Op } = require('sequelize');

// Get a user's loyalty status
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
    
    return res.status(200).json({
      success: true,
      data: {
        loyalty,
        availableRewards: rewards,
        recentRedemptions: redemptions
      }
    });
  } catch (error) {
    console.error('Error getting user loyalty:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user loyalty',
      error: error.message
    });
  }
};

// Create or update a user's loyalty
exports.updateUserLoyalty = async (req, res) => {
  try {
    const { userId, restaurantId, points, action } = req.body;
    
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
        lastPointEarned: new Date()
      }
    });
    
    if (!created) {
      // Update existing record
      let newPoints;
      
      if (action === 'add') {
        // Add points
        newPoints = loyalty.points + points;
      } else if (action === 'subtract') {
        // Subtract points, but don't go below 0
        newPoints = Math.max(0, loyalty.points - points);
      } else if (action === 'set') {
        // Set to specific value
        newPoints = Math.max(0, points);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "add", "subtract", or "set".'
        });
      }
      
      // Update tier based on points
      let newTier = loyalty.tier;
      if (newPoints >= 1000) {
        newTier = 'platinum';
      } else if (newPoints >= 500) {
        newTier = 'gold';
      } else if (newPoints >= 200) {
        newTier = 'silver';
      } else {
        newTier = 'bronze';
      }
      
      await loyalty.update({
        points: newPoints,
        tier: newTier,
        lastPointEarned: new Date()
      });
      
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
    console.error('Error updating user loyalty:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user loyalty',
      error: error.message
    });
  }
};

// Manage loyalty rewards
// Create loyalty reward
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
      status: req.body.status || 'active'
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
    console.error('Error getting loyalty rewards:', error);
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
    console.error('Error getting loyalty reward:', error);
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
      status: req.body.status || reward.status
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
    console.error('Error updating loyalty reward:', error);
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
    console.error('Error deleting loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete loyalty reward',
      error: error.message
    });
  }
};

// Redeem a reward
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
    if (reward.tier !== 'all' && !['all', loyalty.tier].includes(reward.tier)) {
      return res.status(400).json({
        success: false,
        message: `This reward is only available for ${reward.tier} tier customers`
      });
    }
    
    // Create redemption record
    const redemption = await LoyaltyRedemption.create({
      userId,
      rewardId,
      pointsSpent: reward.pointsRequired,
      orderId: orderId || null,
      status: 'redeemed',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    // Subtract points from user's loyalty
    await loyalty.update({
      points: loyalty.points - reward.pointsRequired
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
        loyalty: updatedLoyalty
      },
      message: 'Reward redeemed successfully'
    });
  } catch (error) {
    console.error('Error redeeming loyalty reward:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to redeem loyalty reward',
      error: error.message
    });
  }
}; 