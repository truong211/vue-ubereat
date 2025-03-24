'use strict';

const db = require('../models');
const ReviewResponse = db.ReviewResponse;
const Review = db.Review;
const User = db.User;
const Restaurant = db.Restaurant;
const { Op } = require('sequelize');

// Create a response to a review
exports.createResponse = async (req, res) => {
  try {
    const { reviewId, restaurantId, response, respondedBy } = req.body;
    
    if (!reviewId || !restaurantId || !response || !respondedBy) {
      return res.status(400).json({
        success: false,
        message: 'Review ID, restaurant ID, response text and responder ID are required'
      });
    }
    
    // Check if review exists
    const review = await Review.findByPk(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if a response already exists
    const existingResponse = await ReviewResponse.findOne({
      where: { reviewId }
    });
    
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'A response to this review already exists. Please update the existing response instead.'
      });
    }
    
    // Create the response
    const reviewResponse = await ReviewResponse.create({
      reviewId,
      restaurantId,
      response,
      respondedBy,
      isEdited: false
    });
    
    const createdResponse = await ReviewResponse.findByPk(reviewResponse.id, {
      include: [
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'rating', 'comment', 'createdAt']
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      data: createdResponse,
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

// Get responses by restaurant
exports.getResponsesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await ReviewResponse.findAndCountAll({
      where: { restaurantId },
      include: [
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'rating', 'comment', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'fullName']
            }
          ]
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
        responses: rows
      }
    });
  } catch (error) {
    console.error('Error getting review responses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get review responses',
      error: error.message
    });
  }
};

// Get response by ID
exports.getResponseById = async (req, res) => {
  try {
    const response = await ReviewResponse.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'rating', 'comment', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'fullName']
            }
          ]
        }
      ]
    });
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Review response not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error getting review response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get review response',
      error: error.message
    });
  }
};

// Update response
exports.updateResponse = async (req, res) => {
  try {
    const response = await ReviewResponse.findByPk(req.params.id);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Review response not found'
      });
    }
    
    // Check if the user updating the response is the original responder or has permission
    if (req.body.respondedBy && req.body.respondedBy !== response.respondedBy) {
      // Here you might want to check if the user has admin permissions
      // This depends on your application's authorization logic
    }
    
    await response.update({
      response: req.body.response || response.response,
      respondedBy: req.body.respondedBy || response.respondedBy,
      isEdited: true
    });
    
    const updatedResponse = await ReviewResponse.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Review,
          as: 'review',
          attributes: ['id', 'rating', 'comment', 'createdAt']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: updatedResponse,
      message: 'Review response updated successfully'
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

// Delete response
exports.deleteResponse = async (req, res) => {
  try {
    const response = await ReviewResponse.findByPk(req.params.id);
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Review response not found'
      });
    }
    
    await response.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Review response deleted successfully'
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

// Get pending reviews (reviews without responses) for a restaurant
exports.getPendingReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Get reviews that don't have responses
    const reviews = await Review.findAll({
      where: { 
        restaurantId,
        id: {
          [Op.notIn]: sequelize.literal(`
            (SELECT reviewId FROM review_responses)
          `)
        }
      }
    });
    
    const reviewIds = reviews.map(review => review.id);
    
    // Get reviews with their users
    const { count, rows } = await Review.findAndCountAll({
      where: { 
        id: {
          [Op.in]: reviewIds
        }
      },
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
        reviews: rows
      }
    });
  } catch (error) {
    console.error('Error getting pending reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pending reviews',
      error: error.message
    });
  }
}; 