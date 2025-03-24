'use strict';

const db = require('../models');
const Promotion = db.Promotion;
const Restaurant = db.Restaurant;
const Product = db.Product;
const { Op } = require('sequelize');

// Create a new promotion/voucher
exports.createPromotion = async (req, res) => {
  try {
    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({
      where: { code: req.body.code }
    });

    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create promotion
    const promotion = await Promotion.create({
      restaurantId: req.body.restaurantId,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      startDate: startDate,
      endDate: endDate,
      minOrderValue: req.body.minOrderValue || null,
      maxDiscount: req.body.maxDiscount || null,
      usageLimit: req.body.usageLimit || null,
      status: req.body.status || 'active'
    });

    // Link products if specified
    if (req.body.productIds && req.body.productIds.length > 0) {
      const products = await Product.findAll({
        where: { id: { [Op.in]: req.body.productIds } }
      });
      
      await promotion.setProducts(products);
    }

    return res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully'
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create promotion',
      error: error.message
    });
  }
};

// Get all promotions (with filters)
exports.getAllPromotions = async (req, res) => {
  try {
    const { 
      restaurantId, 
      status, 
      code,
      active = true, // by default show only active promotions
      page = 1,
      limit = 10
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};
    
    // Apply filters
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (code) {
      where.code = { [Op.like]: `%${code}%` };
    }
    
    // Only show active promotions (not expired)
    if (active === 'true' || active === true) {
      where.endDate = { [Op.gte]: new Date() };
      where.startDate = { [Op.lte]: new Date() };
      where.status = 'active';
    }
    
    // Get promotions
    const { count, rows } = await Promotion.findAndCountAll({
      where,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name'],
          through: { attributes: [] }
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
        promotions: rows
      }
    });
  } catch (error) {
    console.error('Error getting promotions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get promotions',
      error: error.message
    });
  }
};

// Get promotion by ID
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    console.error('Error getting promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get promotion',
      error: error.message
    });
  }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    // Check if the promotion code is being changed and if it already exists
    if (req.body.code && req.body.code !== promotion.code) {
      const existingPromotion = await Promotion.findOne({
        where: { code: req.body.code }
      });
      
      if (existingPromotion) {
        return res.status(400).json({
          success: false,
          message: 'Promotion code already exists'
        });
      }
    }
    
    // Validate dates if provided
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }
    
    // Update promotion
    await promotion.update({
      restaurantId: req.body.restaurantId !== undefined ? req.body.restaurantId : promotion.restaurantId,
      code: req.body.code ? req.body.code.toUpperCase() : promotion.code,
      description: req.body.description !== undefined ? req.body.description : promotion.description,
      discountType: req.body.discountType || promotion.discountType,
      discountValue: req.body.discountValue !== undefined ? req.body.discountValue : promotion.discountValue,
      startDate: req.body.startDate ? new Date(req.body.startDate) : promotion.startDate,
      endDate: req.body.endDate ? new Date(req.body.endDate) : promotion.endDate,
      minOrderValue: req.body.minOrderValue !== undefined ? req.body.minOrderValue : promotion.minOrderValue,
      maxDiscount: req.body.maxDiscount !== undefined ? req.body.maxDiscount : promotion.maxDiscount,
      usageLimit: req.body.usageLimit !== undefined ? req.body.usageLimit : promotion.usageLimit,
      status: req.body.status || promotion.status
    });
    
    // Update products if specified
    if (req.body.productIds) {
      const products = await Product.findAll({
        where: { id: { [Op.in]: req.body.productIds } }
      });
      
      await promotion.setProducts(products);
    }
    
    const updatedPromotion = await Promotion.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update promotion',
      error: error.message
    });
  }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    await promotion.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
      error: error.message
    });
  }
};

// Validate a promotion code
exports.validatePromotion = async (req, res) => {
  try {
    const { code, restaurantId, orderAmount } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code is required'
      });
    }
    
    // Find promotion
    const promotion = await Promotion.findOne({
      where: {
        code: code.toUpperCase(),
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promotion code'
      });
    }
    
    // Check restaurant-specific promotion
    if (promotion.restaurantId && restaurantId && promotion.restaurantId !== parseInt(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Promotion not valid for this restaurant'
      });
    }
    
    // Check minimum order value
    if (promotion.minOrderValue && orderAmount && parseFloat(orderAmount) < promotion.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ${promotion.minOrderValue} required`
      });
    }
    
    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Promotion usage limit reached'
      });
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    
    if (orderAmount) {
      if (promotion.discountType === 'percentage') {
        discountAmount = (parseFloat(orderAmount) * promotion.discountValue) / 100;
        
        // Apply max discount if available
        if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
          discountAmount = promotion.maxDiscount;
        }
      } else { // fixed_amount
        discountAmount = promotion.discountValue;
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ...promotion.toJSON(),
        discountAmount
      },
      message: 'Valid promotion code'
    });
  } catch (error) {
    console.error('Error validating promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate promotion',
      error: error.message
    });
  }
};

// Apply a promotion to an order
exports.applyPromotion = async (req, res) => {
  try {
    const { code, orderId, restaurantId, orderAmount } = req.body;
    
    if (!code || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code and order ID are required'
      });
    }
    
    // Find and validate promotion code
    const validation = await exports.validatePromotion({
      body: { code, restaurantId, orderAmount }
    }, { status: () => ({ json: data => data }) });
    
    if (!validation.success) {
      return res.status(400).json(validation);
    }
    
    const promotion = validation.data;
    
    // Update promotion usage count
    await Promotion.update(
      { usageCount: promotion.usageCount + 1 },
      { where: { id: promotion.id } }
    );
    
    // Return the applied promotion
    return res.status(200).json({
      success: true,
      data: {
        promotionId: promotion.id,
        code: promotion.code,
        discountAmount: promotion.discountAmount,
        discountType: promotion.discountType,
        orderId
      },
      message: 'Promotion applied successfully'
    });
  } catch (error) {
    console.error('Error applying promotion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply promotion',
      error: error.message
    });
  }
}; 