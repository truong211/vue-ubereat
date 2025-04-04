const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

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
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Get active promotions
    const promotions = await db.query(`
      SELECT *
      FROM promotions
      WHERE status = 'active'
        AND startDate <= ?
        AND endDate >= ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [now, now, parseInt(limit), offset]);

    // Get total count for pagination
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM promotions
      WHERE status = 'active'
        AND startDate <= ?
        AND endDate >= ?
    `, [now, now]);
    
    const total = countResult?.total || 0;

    res.status(200).json({
      status: 'success',
      results: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        promotions
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
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Find promotion
    const [promotion] = await db.query(`
      SELECT *
      FROM promotions
      WHERE id = ?
        AND status = 'active'
        AND startDate <= ?
        AND endDate >= ?
    `, [id, now, now]);

    if (!promotion) {
      return next(new AppError('Promotion not found or not active', 404));
    }

    // Get associated products
    const products = await db.query(`
      SELECT p.id, p.name, p.price, p.image_url
      FROM products p
      JOIN product_promotions pp ON p.id = pp.product_id
      WHERE pp.promotion_id = ?
    `, [id]);

    promotion.products = products;

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
exports.validatePromotion = async (req, res) => {
  try {
    const { code, restaurantId, orderTotal, items } = req.body;
    const userId = req.user.id;

    // Find promotion by code
    const [promotion] = await db.query(
      `SELECT * FROM promotions WHERE code = ? AND isActive = true`,
      [code]
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promotion code'
      });
    }

    // Check if promotion is active
    const now = new Date();
    if (promotion.start_date && new Date(promotion.start_date) > now) {
      return res.status(400).json({
        success: false,
        message: 'Promotion is not active yet'
      });
    }

    if (promotion.end_date && new Date(promotion.end_date) < now) {
      return res.status(400).json({
        success: false,
        message: 'Promotion has expired'
      });
    }

    // Check usage limits
    if (promotion.usage_limit && promotion.current_redemptions >= promotion.usage_limit) {
      return res.status(400).json({
        success: false,
        message: 'Promotion usage limit reached'
      });
    }

    // Check per-user limit
    if (promotion.per_user_limit) {
      const [userRedemptions] = await db.query(
        `SELECT COUNT(*) as count FROM user_promotions WHERE userId = ? AND promotionId = ?`,
        [userId, promotion.id]
      );

      if (userRedemptions.count >= promotion.per_user_limit) {
        return res.status(400).json({
          success: false,
          message: 'You have reached the maximum usage limit for this promotion'
        });
      }
    }

    // Check minimum order amount
    if (promotion.min_order_amount && orderTotal < promotion.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${promotion.min_order_amount} required for this promotion`
      });
    }

    // Check restaurant restriction (if applicable)
    if (promotion.restaurantId && promotion.restaurantId !== parseInt(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'This promotion is not valid for the selected restaurant'
      });
    }

    // Check product restrictions (if applicable)
    let isApplicable = true;
    let discountableAmount = orderTotal;

    if (promotion.categoryId) {
      // Check if order includes items from the required category
      const categoryItems = items.filter(item => item.categoryId === promotion.categoryId);
      
      if (categoryItems.length === 0) {
        isApplicable = false;
      } else {
        // Calculate discountable amount (only category items)
        discountableAmount = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    }

    // Check if promotion is tied to specific products
    const productRestrictions = await db.query(
      `SELECT product_id FROM product_promotions WHERE promotion_id = ?`,
      [promotion.id]
    );

    if (productRestrictions.length > 0) {
      const validProductIds = productRestrictions.map(p => p.product_id);
      
      // Check if order includes at least one of the valid products
      const hasValidProduct = items.some(item => validProductIds.includes(item.productId));
      
      if (!hasValidProduct) {
        isApplicable = false;
      } else {
        // Calculate discountable amount (only applicable products)
        discountableAmount = items
          .filter(item => validProductIds.includes(item.productId))
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    }

    if (!isApplicable) {
      return res.status(400).json({
        success: false,
        message: 'This promotion is not applicable to your current order items'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (promotion.discount_type === 'percentage') {
      discountAmount = (discountableAmount * promotion.discount_value) / 100;
      
      // Apply max discount if set
      if (promotion.max_discount && discountAmount > promotion.max_discount) {
        discountAmount = promotion.max_discount;
      }
    } else { // Fixed amount
      discountAmount = promotion.discount_value;
      
      // Don't exceed the order total
      if (discountAmount > discountableAmount) {
        discountAmount = discountableAmount;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Promotion code valid',
      data: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        discountType: promotion.discount_type,
        discountValue: promotion.discount_value,
        discountAmount: discountAmount.toFixed(2),
        isApplicableToEntireOrder: !promotion.categoryId && productRestrictions.length === 0
      }
    });
  } catch (error) {
    logger.error('Error validating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promotion',
      error: error.message
    });
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
      const restaurant = await db.query(`
        SELECT id
        FROM restaurants
        WHERE userId = ?
      `, [req.user.id]);
      if (restaurant.length === 0) {
        return next(new AppError('Restaurant not found', 404));
      }

      // Get products for this restaurant
      const products = await db.query(`
        SELECT id
        FROM products
        WHERE restaurantId = ?
      `, [restaurant[0].id]);
      const productIds = products.map(product => product.id);

      // Get promotions linked to these products
      const productPromotions = await db.query(`
        SELECT promotion_id
        FROM product_promotions
        WHERE product_id IN (${productIds.join(',')})
      `);
      const promotionIds = productPromotions.map(pp => pp.promotion_id);

      // Add to filter
      filter.id = { [Op.in]: promotionIds };
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get promotions
    const promotions = await db.query(`
      SELECT *
      FROM promotions
      WHERE ${Object.keys(filter).map(key => `${key} = ?`).join(' AND ')}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [...Object.values(filter), parseInt(limit), offset]);

    // Get total count for pagination
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM promotions
      WHERE ${Object.keys(filter).map(key => `${key} = ?`).join(' AND ')}
    `, [...Object.values(filter)]);
    
    const total = countResult?.total || 0;

    res.status(200).json({
      status: 'success',
      results: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        promotions
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
exports.createPromotion = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      isActive,
      usageLimit,
      perUserLimit,
      restaurantId,
      categoryId,
      productIds,
      campaignId
    } = req.body;

    // Validate promotion code uniqueness
    const [existingPromotion] = await db.query(
      'SELECT id FROM promotions WHERE code = ?',
      [code]
    );

    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create promotion
      const result = await connection.query(
        `INSERT INTO promotions SET ?`,
        {
          code,
          name,
          description,
          discount_type: discountType,
          discount_value: discountValue,
          min_order_amount: minOrderAmount || 0,
          max_discount: maxDiscount || null,
          start_date: startDate,
          end_date: endDate,
          isActive: isActive || false,
          usage_limit: usageLimit || null,
          per_user_limit: perUserLimit || null,
          current_redemptions: 0,
          restaurantId: restaurantId || null,
          categoryId: categoryId || null,
          campaign_id: campaignId || null,
          created_by: req.user.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      );

      const promotionId = result.insertId;

      // Add product associations if provided
      if (productIds && productIds.length > 0) {
        const productPromotions = productIds.map(productId => [
          promotionId,
          productId
        ]);

        await connection.query(
          `INSERT INTO product_promotions (promotion_id, product_id) VALUES ?`,
          [productPromotions]
        );
      }

      // Commit transaction
      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Promotion created successfully',
        data: {
          id: promotionId,
          code
        }
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Error creating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create promotion',
      error: error.message
    });
  }
};

/**
 * Update a promotion
 * @route PUT /api/promotions/:id
 * @access Private/Admin
 */
exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      isActive,
      usageLimit,
      perUserLimit,
      restaurantId,
      categoryId,
      productIds,
      campaignId
    } = req.body;

    // Check if promotion exists
    const [existingPromotion] = await db.query(
      'SELECT * FROM promotions WHERE id = ?',
      [id]
    );

    if (!existingPromotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update promotion
      await connection.query(
        `UPDATE promotions SET
          name = ?,
          description = ?,
          discount_type = ?,
          discount_value = ?,
          min_order_amount = ?,
          max_discount = ?,
          start_date = ?,
          end_date = ?,
          isActive = ?,
          usage_limit = ?,
          per_user_limit = ?,
          restaurantId = ?,
          categoryId = ?,
          campaign_id = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          name || existingPromotion.name,
          description || existingPromotion.description,
          discountType || existingPromotion.discount_type,
          discountValue || existingPromotion.discount_value,
          minOrderAmount || existingPromotion.min_order_amount,
          maxDiscount || existingPromotion.max_discount,
          startDate || existingPromotion.start_date,
          endDate || existingPromotion.end_date,
          isActive !== undefined ? isActive : existingPromotion.isActive,
          usageLimit || existingPromotion.usage_limit,
          perUserLimit || existingPromotion.per_user_limit,
          restaurantId || existingPromotion.restaurantId,
          categoryId || existingPromotion.categoryId,
          campaignId || existingPromotion.campaign_id,
          new Date(),
          id
        ]
      );

      // Update product associations if provided
      if (productIds) {
        // Delete existing associations
        await connection.query(
          'DELETE FROM product_promotions WHERE promotion_id = ?',
          [id]
        );

        // Add new associations
        if (productIds.length > 0) {
          const productPromotions = productIds.map(productId => [
            id,
            productId
          ]);

          await connection.query(
            `INSERT INTO product_promotions (promotion_id, product_id) VALUES ?`,
            [productPromotions]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Promotion updated successfully',
        data: {
          id,
          code: existingPromotion.code
        }
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Error updating promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update promotion',
      error: error.message
    });
  }
};

/**
 * Delete a promotion
 * @route DELETE /api/promotions/:id
 * @access Private/Admin
 */
exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if promotion exists
    const [existingPromotion] = await db.query(
      'SELECT * FROM promotions WHERE id = ?',
      [id]
    );

    if (!existingPromotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Delete product associations
      await connection.query(
        'DELETE FROM product_promotions WHERE promotion_id = ?',
        [id]
      );

      // Delete promotion
      await connection.query(
        'DELETE FROM promotions WHERE id = ?',
        [id]
      );

      // Commit transaction
      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Promotion deleted successfully'
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Error deleting promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
      error: error.message
    });
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
    const products = await db.query(`
      SELECT id
      FROM products
      WHERE restaurantId = ?
    `, [restaurantId]);

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
    const promotionIds = await db.query(`
      SELECT promotion_id
      FROM product_promotions
      WHERE product_id IN (${productIds.join(',')})
    `).then(results => results.map(result => result.promotion_id));

    // Get active promotions
    const promotions = await db.query(`
      SELECT *
      FROM promotions
      WHERE id IN (${promotionIds.join(',')})
        AND status = 'active'
        AND startDate <= ?
        AND endDate >= ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [new Date().toISOString().slice(0, 19).replace('T', ' '), new Date().toISOString().slice(0, 19).replace('T', ' '), parseInt(limit), offset]);

    res.status(200).json({
      status: 'success',
      results: promotions.length,
      totalPages: Math.ceil(promotions.length / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        promotions
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
    const promotionIds = await db.query(`
      SELECT promotion_id
      FROM product_promotions
      WHERE product_id = ?
    `, [productId]).then(results => results.map(result => result.promotion_id));

    // Get active promotions
    const promotions = await db.query(`
      SELECT *
      FROM promotions
      WHERE id IN (${promotionIds.join(',')})
        AND status = 'active'
        AND startDate <= ?
        AND endDate >= ?
      ORDER BY createdAt DESC
    `, [new Date().toISOString().slice(0, 19).replace('T', ' '), new Date().toISOString().slice(0, 19).replace('T', ' ')]);

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

    const promotion = await db.query(`
      SELECT *
      FROM promotions
      WHERE id = ?
    `, [id]);
    if (promotion.length === 0) {
      return next(new AppError('Promotion not found', 404));
    }

    // Get usage statistics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const usageStats = await db.query(`
      SELECT *
      FROM user_promotions
      WHERE promotionId = ?
        AND createdAt >= ?
    `, [id, startDate.toISOString().slice(0, 19).replace('T', ' ')]);

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
        id: promotion[0].id,
        code: promotion[0].code,
        status: promotion[0].status,
        totalRedemptions: promotion[0].currentRedemptions,
        totalDiscountAmount: promotion[0].totalDiscountAmount,
        totalOrderValue: promotion[0].totalOrderValue,
        averageOrderValue: promotion[0].totalOrderValue / promotion[0].currentRedemptions || 0,
        redemptionRate: (promotion[0].currentRedemptions / promotion[0].maxRedemptions * 100) || 0,
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
      db.query(`
        SELECT *
        FROM orders
        WHERE id = ?
      `, [orderId]),
      db.query(`
        SELECT *
        FROM promotions
        WHERE id = ?
      `, [promotionId])
    ]);

    if (order.length === 0 || promotion.length === 0) {
      return next(new AppError('Order or promotion not found', 404));
    }

    // Record promotion usage
    await db.query(`
      INSERT INTO user_promotions (userId, promotionId, orderId, discountAmount, orderTotal)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, promotion[0].id, order[0].id, order[0].discountAmount, order[0].totalAmount]);

    // Update promotion statistics
    await db.query(`
      UPDATE promotions
      SET currentRedemptions = currentRedemptions + 1,
          totalDiscountAmount = totalDiscountAmount + ?,
          totalOrderValue = totalOrderValue + ?,
          lastUsedAt = ?
      WHERE id = ?
    `, [parseFloat(order[0].discountAmount), parseFloat(order[0].totalAmount), new Date(), promotion[0].id]);

    res.status(200).json({
      status: 'success',
      message: 'Promotion applied successfully'
    });
  } catch (error) {
    next(error);
  }
};