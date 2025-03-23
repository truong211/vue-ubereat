const { validationResult } = require('express-validator');
const { Promotion, Product, Restaurant, ProductPromotion, UserPromotion, Order } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * Get all active promotions
 * @route GET /api/promotions
 * @access Public
 */
exports.getActivePromotions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get active promotions
    const promotions = await Promotion.findAndCountAll({
      where: {
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: promotions.count,
      totalPages: Math.ceil(promotions.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        promotions: promotions.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get promotion details
 * @route GET /api/promotions/:id
 * @access Public
 */
exports.getPromotionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find promotion
    const promotion = await Promotion.findOne({
      where: {
        id,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      },
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: [] },
          attributes: ['id', 'name', 'price', 'image_url']
        }
      ]
    });

    if (!promotion) {
      return next(new AppError('Promotion not found or not active', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        promotion
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate a promotion code
 * @route POST /api/promotions/validate
 * @access Private
 */
exports.validatePromotion = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, restaurantId, orderAmount } = req.body;

    // Find promotion
    const promotion = await Promotion.findOne({
      where: {
        code,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (!promotion) {
      return next(new AppError('Invalid or expired promotion code', 400));
    }

    // Check minimum order value
    if (promotion.minOrderValue && orderAmount < promotion.minOrderValue) {
      return next(new AppError(`Minimum order amount of $${promotion.minOrderValue} required for this promotion`, 400));
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.discountType === 'percentage') {
      discountAmount = (orderAmount * promotion.discountValue) / 100;
      // Apply max discount if set
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount;
      }
    } else {
      // Fixed amount discount
      discountAmount = promotion.discountValue;
    }

    // If restaurant-specific, check if applicable
    if (restaurantId) {
      // Check if promotion is linked to specific products
      const productPromotions = await ProductPromotion.findAll({
        where: { promotionId: promotion.id },
        include: [
          {
            model: Product,
            where: { restaurantId }
          }
        ]
      });

      // If no products from this restaurant are linked to the promotion
      if (productPromotions.length === 0) {
        return next(new AppError('This promotion is not applicable to this restaurant', 400));
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        promotion,
        discountAmount,
        finalAmount: orderAmount - discountAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all promotions (including inactive) for admin
 * @route GET /api/promotions/admin/all
 * @access Private/Admin
 */
exports.getAllPromotions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // For restaurant owners, only show their promotions
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
      if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
      }

      // Get products for this restaurant
      const products = await Product.findAll({ where: { restaurantId: restaurant.id } });
      const productIds = products.map(product => product.id);

      // Get promotions linked to these products
      const productPromotions = await ProductPromotion.findAll({
        where: { productId: { [Op.in]: productIds } }
      });
      const promotionIds = productPromotions.map(pp => pp.promotionId);

      // Add to filter
      filter.id = { [Op.in]: promotionIds };
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get promotions
    const promotions = await Promotion.findAndCountAll({
      where: filter,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      results: promotions.count,
      totalPages: Math.ceil(promotions.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        promotions: promotions.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new promotion
 * @route POST /api/promotions
 * @access Private/Admin
 */
exports.createPromotion = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      minOrderValue,
      maxDiscount,
      restaurantId,
      productIds
    } = req.body;

    // Check if code already exists
    const existingPromotion = await Promotion.findOne({ where: { code } });
    if (existingPromotion) {
      return next(new AppError('Promotion code already exists', 400));
    }

    // Create promotion
    const promotion = await Promotion.create({
      code,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      minOrderValue,
      maxDiscount,
      status: 'active'
    });

    // If product IDs are provided, link them to the promotion
    if (productIds && productIds.length > 0) {
      // If restaurantId is provided, verify products belong to this restaurant
      if (restaurantId) {
        const products = await Product.findAll({
          where: {
            id: { [Op.in]: productIds },
            restaurantId
          }
        });

        if (products.length !== productIds.length) {
          return next(new AppError('Some products do not belong to the specified restaurant', 400));
        }
      }

      // Create product-promotion associations
      const productPromotions = productIds.map(productId => ({
        productId,
        promotionId: promotion.id
      }));

      await ProductPromotion.bulkCreate(productPromotions);
    }

    res.status(201).json({
      status: 'success',
      data: {
        promotion
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a promotion
 * @route PUT /api/promotions/:id
 * @access Private/Admin
 */
exports.updatePromotion = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      minOrderValue,
      maxDiscount,
      status,
      productIds
    } = req.body;

    // Find promotion
    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    // For restaurant owners, verify they can update this promotion
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
      if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
      }

      // Check if promotion is linked to this restaurant's products
      const productPromotions = await ProductPromotion.findAll({
        where: { promotionId: promotion.id },
        include: [
          {
            model: Product,
            where: { restaurantId: restaurant.id }
          }
        ]
      });

      if (productPromotions.length === 0) {
        return next(new AppError('You are not authorized to update this promotion', 403));
      }
    }

    // If code is being changed, check if new code already exists
    if (code && code !== promotion.code) {
      const existingPromotion = await Promotion.findOne({ where: { code } });
      if (existingPromotion) {
        return next(new AppError('Promotion code already exists', 400));
      }
    }

    // Update promotion
    await promotion.update({
      code: code || promotion.code,
      description: description !== undefined ? description : promotion.description,
      discountType: discountType || promotion.discountType,
      discountValue: discountValue !== undefined ? discountValue : promotion.discountValue,
      startDate: startDate || promotion.startDate,
      endDate: endDate || promotion.endDate,
      minOrderValue: minOrderValue !== undefined ? minOrderValue : promotion.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? maxDiscount : promotion.maxDiscount,
      status: status || promotion.status
    });

    // If product IDs are provided, update product-promotion associations
    if (productIds) {
      // Delete existing associations
      await ProductPromotion.destroy({ where: { promotionId: promotion.id } });

      // Create new associations
      if (productIds.length > 0) {
        const productPromotions = productIds.map(productId => ({
          productId,
          promotionId: promotion.id
        }));

        await ProductPromotion.bulkCreate(productPromotions);
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        promotion
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a promotion
 * @route DELETE /api/promotions/:id
 * @access Private/Admin
 */
exports.deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find promotion
    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    // For restaurant owners, verify they can delete this promotion
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
      if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
      }

      // Check if promotion is linked to this restaurant's products
      const productPromotions = await ProductPromotion.findAll({
        where: { promotionId: promotion.id },
        include: [
          {
            model: Product,
            where: { restaurantId: restaurant.id }
          }
        ]
      });

      if (productPromotions.length === 0) {
        return next(new AppError('You are not authorized to delete this promotion', 403));
      }
    }

    // Delete product-promotion associations
    await ProductPromotion.destroy({ where: { promotionId: promotion.id } });
    
    // Set status to inactive instead of deleting
    await promotion.update({ status: 'inactive' });

    res.status(200).json({
      status: 'success',
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get promotions for a specific restaurant
 * @route GET /api/promotions/restaurant/:restaurantId
 * @access Public
 */
exports.getRestaurantPromotions = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get restaurant products
    const products = await Product.findAll({
      where: { restaurantId },
      attributes: ['id']
    });

    if (products.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: {
          promotions: []
        }
      });
    }

    const productIds = products.map(product => product.id);

    // Get promotions linked to these products
    const promotionIds = await ProductPromotion.findAll({
      where: { productId: { [Op.in]: productIds } },
      attributes: ['promotionId'],
      group: ['promotionId']
    }).then(results => results.map(result => result.promotionId));

    // Get active promotions
    const promotions = await Promotion.findAndCountAll({
      where: {
        id: { [Op.in]: promotionIds },
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: promotions.count,
      totalPages: Math.ceil(promotions.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        promotions: promotions.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get promotions for a specific product
 * @route GET /api/promotions/product/:productId
 * @access Public
 */
exports.getProductPromotions = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Get promotions linked to this product
    const promotionIds = await ProductPromotion.findAll({
      where: { productId },
      attributes: ['promotionId']
    }).then(results => results.map(result => result.promotionId));

    // Get active promotions
    const promotions = await Promotion.findAll({
      where: {
        id: { [Op.in]: promotionIds },
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: promotions.length,
      data: {
        promotions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get promotion statistics
 * @route GET /api/promotions/:id/stats
 * @access Private/Admin
 */
exports.getPromotionStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeRange = 30 } = req.query; // Days to look back

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    // Get usage statistics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const usageStats = await UserPromotion.findAll({
      where: {
        promotionId: id,
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['totalAmount']
        }
      ]
    });

    // Calculate daily statistics
    const dailyStats = {};
    usageStats.forEach(usage => {
      const date = usage.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          redemptions: 0,
          discountAmount: 0,
          orderValue: 0
        };
      }
      dailyStats[date].redemptions++;
      dailyStats[date].discountAmount += parseFloat(usage.discountAmount);
      dailyStats[date].orderValue += parseFloat(usage.order.totalAmount);
    });

    // Format response data
    const timeAnalytics = Object.keys(dailyStats).map(date => ({
      date,
      ...dailyStats[date],
      averageOrderValue: dailyStats[date].orderValue / dailyStats[date].redemptions
    }));

    res.status(200).json({
      status: 'success',
      data: {
        id: promotion.id,
        code: promotion.code,
        status: promotion.status,
        totalRedemptions: promotion.currentRedemptions,
        totalDiscountAmount: promotion.totalDiscountAmount,
        totalOrderValue: promotion.totalOrderValue,
        averageOrderValue: promotion.totalOrderValue / promotion.currentRedemptions || 0,
        redemptionRate: (promotion.currentRedemptions / promotion.maxRedemptions * 100) || 0,
        timeAnalytics
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply a promotion to an order
 * @route POST /api/promotions/apply
 * @access Private
 */
exports.applyPromotion = async (req, res, next) => {
  try {
    const { orderId, promotionId } = req.body;

    const [order, promotion] = await Promise.all([
      Order.findByPk(orderId),
      Promotion.findByPk(promotionId)
    ]);

    if (!order || !promotion) {
      return next(new AppError('Order or promotion not found', 404));
    }

    // Record promotion usage
    await UserPromotion.create({
      userId: req.user.id,
      promotionId,
      orderId,
      discountAmount: order.discountAmount,
      orderTotal: order.totalAmount
    });

    // Update promotion statistics
    await promotion.update({
      currentRedemptions: promotion.currentRedemptions + 1,
      totalDiscountAmount: promotion.totalDiscountAmount + parseFloat(order.discountAmount),
      totalOrderValue: promotion.totalOrderValue + parseFloat(order.totalAmount),
      lastUsedAt: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Promotion applied successfully'
    });
  } catch (error) {
    next(error);
  }
};