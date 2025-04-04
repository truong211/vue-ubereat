const express = require('express');
const router = express.Router();
const { protect, optionalToken } = require('../middleware/auth.middleware');
const db = require('../config/database');
const logger = require('../utils/logger');

// Create a simple controller directly in the router for now
// This can be moved to a dedicated controller file later

/**
 * @route GET /api/recommendations
 * @desc Get recommended items based on user's order history and preferences
 * @access Public (with enhanced features for logged-in users)
 */
router.get('/', optionalToken, async (req, res) => {
  try {
    // Use direct SQL query instead of the ORM model to avoid parameter issues
    const sql = `
      SELECT p.*, r.name as restaurantName, c.name as categoryName
      FROM products p
      LEFT JOIN restaurants r ON p.restaurantId = r.id
      LEFT JOIN categories c ON p.categoryId = c.id
      ORDER BY p.id DESC
      LIMIT 8
    `;
    
    const recommendations = await db.query(sql);
    
    // If no recommendations found, return empty array
    if (!recommendations || recommendations.length === 0) {
      logger.info('No recommendations found');
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

/**
 * @route GET /api/recommendations/foods
 * @desc Get recommended food items
 * @access Public (with enhanced features for logged-in users)
 */
router.get('/foods', optionalToken, async (req, res) => {
  try {
    // Use direct SQL query instead of the ORM model
    const sql = `
      SELECT p.*, r.name as restaurantName, c.name as categoryName
      FROM products p
      LEFT JOIN restaurants r ON p.restaurantId = r.id
      LEFT JOIN categories c ON p.categoryId = c.id
      ORDER BY p.id DESC
      LIMIT 10
    `;
    
    const recommendations = await db.query(sql);
    
    // If no recommendations found, return empty array
    if (!recommendations || recommendations.length === 0) {
      logger.info('No food recommendations found');
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting food recommendations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch food recommendations',
      error: error.message
    });
  }
});

/**
 * @route GET /api/recommendations/restaurants
 * @desc Get recommended restaurants
 * @access Public (with enhanced features for logged-in users)
 */
router.get('/restaurants', optionalToken, async (req, res) => {
  try {
    // Use direct SQL query for consistency
    const sql = `
      SELECT r.id, r.name, r.description, r.address, r.logo, r.coverImage, r.cuisineType, 
             r.priceRange, r.rating, r.deliveryFee
      FROM restaurants r
      ORDER BY r.rating DESC
      LIMIT 6
    `;
    
    const recommendations = await db.query(sql);
    
    // If no recommendations found, return empty array
    if (!recommendations || recommendations.length === 0) {
      logger.info('No restaurant recommendations found');
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: recommendations
    });
  } catch (error) {
    logger.error('Error getting restaurant recommendations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch restaurant recommendations',
      error: error.message
    });
  }
});

module.exports = router; 