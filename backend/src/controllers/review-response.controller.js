'use strict';

const { ReviewResponse, Review, Restaurant, User } = require('../models');
const { Op } = require('sequelize');

// Create a response to a review
exports.createResponse = async (req, res) => {
  try {
    const { reviewId, restaurantId, response, respondedBy } = req.body;
    
    // Check if review exists
    const review = await Review.findByPk(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Check if response already exists
    const existingResponse = await ReviewResponse.findOne({
      where: { reviewId }
    });
    
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'A response to this review already exists. Please use update instead.'
      });
    }
    
    // Create review response
    const reviewResponse = await ReviewResponse.create({
      reviewId,
      restaurantId,
      response,
      respondedBy,
      isEdited: false
    });
    
    // Get the response with related data
    const responseWithDetails = await ReviewResponse.findByPk(reviewResponse.id, {
      include: [
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'userId', 'rating', 'comment', 'createdAt']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      data: responseWithDetails,
      message: 'Response to review created successfully'
    });
  } catch (error) {
    console.error('Error creating review response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create review response',
      error: error.message
    });
  }
};

// Update a response to a review
exports.updateResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, respondedBy } = req.body;
    
    // Check if response exists
    const reviewResponse = await ReviewResponse.findByPk(id);
    
    if (!reviewResponse) {
      return res.status(404).json({
        success: false,
        message: 'Review response not found'
      });
    }
    
    // Update review response
    await reviewResponse.update({
      response,
      respondedBy: respondedBy || reviewResponse.respondedBy,
      isEdited: true
    });
    
    // Get the updated response with related data
    const updatedResponse = await ReviewResponse.findByPk(id, {
      include: [
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'userId', 'rating', 'comment', 'createdAt']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: updatedResponse,
      message: 'Response to review updated successfully'
    });
  } catch (error) {
    console.error('Error updating review response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update review response',
      error: error.message
    });
  }
};

// Delete a response to a review
exports.deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if response exists
    const reviewResponse = await ReviewResponse.findByPk(id);
    
    if (!reviewResponse) {
      return res.status(404).json({
        success: false,
        message: 'Review response not found'
      });
    }
    
    // Delete review response
    await reviewResponse.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Response to review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review response',
      error: error.message
    });
  }
};

// Get response by review ID
exports.getResponseByReviewId = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Get review response
    const reviewResponse = await ReviewResponse.findOne({
      where: { reviewId },
      include: [
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'userId', 'rating', 'comment', 'createdAt']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!reviewResponse) {
      return res.status(404).json({
        success: false,
        message: 'No response found for this review'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: reviewResponse
    });
  } catch (error) {
    console.error('Error fetching review response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch review response',
      error: error.message
    });
  }
};

// Get all responses for a restaurant
exports.getResponsesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get total count
    const totalCount = await ReviewResponse.count({
      where: { restaurantId }
    });
    
    // Get review responses
    const reviewResponses = await ReviewResponse.findAll({
      where: { restaurantId },
      include: [
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'userId', 'rating', 'comment', 'createdAt']
        },
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        responses: reviewResponses,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant review responses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant review responses',
      error: error.message
    });
  }
};

// Get review response analytics
exports.getResponseAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    let where = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    // Get total reviews with responses
    const totalResponses = await ReviewResponse.count({ where });
    
    // Get response rate (if restaurant is specified)
    let responseRate = null;
    if (restaurantId) {
      const totalReviews = await Review.count({
        where: { restaurantId }
      });
      
      responseRate = totalReviews > 0 
        ? (totalResponses / totalReviews) * 100 
        : 0;
    }
    
    // Get average response time (if possible to calculate this with your data model)
    // This would require Review and ReviewResponse to have accurate timestamps
    // and a way to calculate the difference
    
    // Get most active responders
    const responders = await ReviewResponse.findAll({
      attributes: [
        'respondedBy',
        [sequelize.fn('COUNT', sequelize.col('id')), 'responseCount']
      ],
      where,
      include: [
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name']
        }
      ],
      group: ['respondedBy', 'responder.id', 'responder.name'],
      order: [[sequelize.literal('responseCount'), 'DESC']],
      limit: 5
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalResponses,
        responseRate,
        responders
      }
    });
  } catch (error) {
    console.error('Error getting response analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get response analytics',
      error: error.message
    });
  }
}; 