const express = require('express');
const router = express.Router();
const db = require('../models');
const Restaurant = db.Restaurant;
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// Get featured restaurants with sorting and pagination
router.get('/', async (req, res) => {
  try {
    const {
      featured = false,
      limit = 6,
      sort = 'rating',
      page = 1
    } = req.query;

    const offset = (page - 1) * limit;
    let order = [['createdAt', 'DESC']];

    if (sort === 'rating') {
      order = [['averageRating', 'DESC']];
    }

    const where = {
      isActive: true,
      isVerified: true
    };

    if (featured === 'true') {
      where.averageRating = {
        [Op.gte]: 4.0
      };
    }

    const restaurants = await Restaurant.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order,
      attributes: [
        'id', 'name', 'description', 'logo', 'coverImage',
        'address', 'averageRating', 'totalRatings', 'priceRange',
        'deliveryFee', 'minimumOrderAmount', 'estimatedDeliveryTime',
        'cuisine'
      ]
    });

    res.json({
      items: restaurants.rows,
      total: restaurants.count,
      page: parseInt(page),
      pages: Math.ceil(restaurants.count / limit)
    });
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).json({ message: 'Error fetching restaurants' });
  }
});

// Get nearby restaurants
router.get('/nearby', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10, // Default radius in kilometers
      limit = 4,
      page = 1
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const offset = (page - 1) * limit;

    // Calculate distance using Haversine formula
    const distanceCalculation = `
      (6371 * acos(
        cos(radians(${parseFloat(latitude)})) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(${parseFloat(longitude)})) +
        sin(radians(${parseFloat(latitude)})) *
        sin(radians(latitude))
      ))`;

    const restaurants = await Restaurant.findAndCountAll({
      attributes: {
        include: [
          [sequelize.literal(distanceCalculation), 'distance']
        ]
      },
      where: {
        isActive: true,
        isVerified: true
      },
      having: sequelize.literal(`distance <= ${parseFloat(radius)}`),
      order: [[sequelize.literal('distance'), 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      items: restaurants.rows,
      total: restaurants.count,
      page: parseInt(page),
      pages: Math.ceil(restaurants.count / limit)
    });
  } catch (err) {
    console.error('Error fetching nearby restaurants:', err);
    res.status(500).json({ message: 'Error fetching nearby restaurants' });
  }
});

module.exports = router;