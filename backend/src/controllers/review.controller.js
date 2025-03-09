const { validationResult } = require('express-validator');
const { Review, User, Product, Order, Restaurant } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * Get all reviews with filtering options
 * @route GET /api/reviews
 * @access Public
 */
exports.getAllReviews = async (req, res, next) => {
  try {
    const { rating, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (rating) {
      filter.rating = rating;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews
    const reviews = await Review.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        reviews: reviews.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a specific product
 * @route GET /api/reviews/product/:productId
 * @access Public
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get product reviews
    const reviews = await Review.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'profileImage']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Calculate average rating
    const avgRating = await Review.findOne({
      where: { productId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      averageRating: avgRating.averageRating ? parseFloat(avgRating.averageRating).toFixed(1) : 0,
      totalReviews: avgRating.totalReviews,
      data: {
        reviews: reviews.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a specific restaurant
 * @route GET /api/reviews/restaurant/:restaurantId
 * @access Public
 */
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get restaurant reviews by joining with products
    const reviews = await Review.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          where: { restaurantId }
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Calculate average rating for restaurant
    const avgRating = await Review.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('Review.id')), 'totalReviews']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: [],
        where: restaurantFilter
      }],
      where: {
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      group: [
        sequelize.fn('MONTH', sequelize.col('Review.createdAt')),
        sequelize.fn('YEAR', sequelize.col('Review.createdAt'))
      ],
      order: [
        [sequelize.fn('YEAR', sequelize.col('Review.createdAt')), 'ASC'],
        [sequelize.fn('MONTH', sequelize.col('Review.createdAt')), 'ASC']
      ],
      raw: true
    });

    // Get most recent reviews
    const recentReviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          where: restaurantFilter,
          include: [{
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      data: {
        ratingStats,
        monthlyStats,
        recentReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update product rating
 * @param {number} productId - Product ID
 */
const updateProductRating = async (productId) => {
  const avgRating = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ],
    raw: true
  });

  if (avgRating && avgRating.averageRating) {
    await Product.update(
      { rating: parseFloat(avgRating.averageRating).toFixed(1) },
      { where: { id: productId } }
    );
  }
};

/**
 * Helper function to update restaurant rating
 * @param {number} restaurantId - Restaurant ID
 */
const updateRestaurantRating = async (restaurantId) => {
  const avgRating = await Review.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ],
    include: [{
      model: Product,
      as: 'product',
      attributes: [],
      where: { restaurantId }
    }],
    raw: true
  });

  if (avgRating && avgRating.averageRating) {
    await Restaurant.update(
      { rating: parseFloat(avgRating.averageRating).toFixed(1) },
      { where: { id: restaurantId } }
    );
  }
};
 'product',
        attributes: [],
        where: { restaurantId }
      }],
      raw: true
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      averageRating: avgRating.averageRating ? parseFloat(avgRating.averageRating).toFixed(1) : 0,
      totalReviews: avgRating.totalReviews,
      data: {
        reviews: reviews.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews by the logged-in user
 * @route GET /api/reviews/user
 * @access Private
 */
exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get user reviews
    const reviews = await Review.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          include: [{
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        reviews: reviews.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new review
 * @route POST /api/reviews
 * @access Private
 */
exports.createReview = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId,
        status: 'delivered' // Only delivered orders can be reviewed
      }
    });

    if (!order) {
      return next(new AppError('Order not found or not eligible for review', 404));
    }

    // Check if product exists in the order
    const orderDetail = await OrderDetail.findOne({
      where: {
        orderId,
        productId
      }
    });

    if (!orderDetail) {
      return next(new AppError('Product not found in this order', 404));
    }

    // Check if user already reviewed this product in this order
    const existingReview = await Review.findOne({
      where: {
        userId,
        orderId,
        productId
      }
    });

    if (existingReview) {
      return next(new AppError('You have already reviewed this product for this order', 400));
    }

    // Create review
    const review = await Review.create({
      userId,
      orderId,
      productId,
      rating,
      comment
    });

    // Update product rating
    await updateProductRating(productId);
    
    // Update restaurant rating
    const product = await Product.findByPk(productId);
    if (product && product.restaurantId) {
      await updateRestaurantRating(product.restaurantId);
    }

    res.status(201).json({
      status: 'success',
      data: {
        review
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a review
 * @route PUT /api/reviews/:id
 * @access Private
 */
exports.updateReview = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Find review
    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment !== undefined ? comment : review.comment;
    await review.save();

    // Update product rating
    await updateProductRating(review.productId);
    
    // Update restaurant rating
    const product = await Product.findByPk(review.productId);
    if (product && product.restaurantId) {
      await updateRestaurantRating(product.restaurantId);
    }

    res.status(200).json({
      status: 'success',
      data: {
        review
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review
 * @route DELETE /api/reviews/:id
 * @access Private
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find review
    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    const productId = review.productId;
    const product = await Product.findByPk(productId);
    const restaurantId = product ? product.restaurantId : null;

    // Delete review
    await review.destroy();

    // Update product rating
    await updateProductRating(productId);
    
    // Update restaurant rating
    if (restaurantId) {
      await updateRestaurantRating(restaurantId);
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get review statistics for dashboard
 * @route GET /api/reviews/dashboard/stats
 * @access Private/Admin
 */
exports.getReviewStats = async (req, res, next) => {
  try {
    // For restaurant owners, only show stats for their restaurant
    let restaurantFilter = {};
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
      if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
      }
      restaurantFilter = { restaurantId: restaurant.id };
    }

    // Get review stats by rating
    const ratingStats = await Review.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('Review.id')), 'count']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: [],
        where: restaurantFilter
      }],
      where: {
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      group: [
        sequelize.fn('MONTH', sequelize.col('Review.createdAt')),
        sequelize.fn('YEAR', sequelize.col('Review.createdAt'))
      ],
      order: [
        [sequelize.fn('YEAR', sequelize.col('Review.createdAt')), 'ASC'],
        [sequelize.fn('MONTH', sequelize.col('Review.createdAt')), 'ASC']
      ],
      raw: true
    });

    // Get most recent reviews
    const recentReviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          where: restaurantFilter,
          include: [{
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      data: {
        ratingStats,
        monthlyStats,
        recentReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update product rating
 * @param {number} productId - Product ID
 */
const updateProductRating = async (productId) => {
  const avgRating = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ],
    raw: true
  });

  if (avgRating && avgRating.averageRating) {
    await Product.update(
      { rating: parseFloat(avgRating.averageRating).toFixed(1) },
      { where: { id: productId } }
    );
  }
};

/**
 * Helper function to update restaurant rating
 * @param {number} restaurantId - Restaurant ID
 */
const updateRestaurantRating = async (restaurantId) => {
  const avgRating = await Review.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ],
    include: [{
      model: Product,
      as: 'product',
      attributes: [],
      where: { restaurantId }
    }],
    raw: true
  });

  if (avgRating && avgRating.averageRating) {
    await Restaurant.update(
      { rating: parseFloat(avgRating.averageRating).toFixed(1) },
      { where: { id: restaurantId } }
    );
  }
};
 'product',
        attributes: [],
        where: restaurantFilter
      }],
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true
    });

    // Get review stats by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Review.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('Review.createdAt')), 'month'],
        [sequelize.fn('YEAR', sequelize.col('Review.createdAt')), 'year'],
        [sequelize.fn('COUNT', sequelize.col('Review.id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: [],
        where: restaurantFilter
      }],
      where: {
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      group: [
        sequelize.fn('MONTH', sequelize.col('Review.createdAt')),
        sequelize.fn('YEAR', sequelize.col('Review.createdAt'))
      ],
      order: [
        [sequelize.fn('YEAR', sequelize.col('Review.createdAt')), 'ASC'],
        [sequelize.fn('MONTH', sequelize.col('Review.createdAt')), 'ASC']
      ],
      raw: true
    });

    // Get most recent reviews
    const recentReviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image_url'],
          where: restaurantFilter,
          include: [{
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      data: {
        ratingStats,
        monthlyStats,
        recentReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update product rating
 * @param {number} productId - Product ID
 */
const updateProductRating = async (productId) => {
  const avgRating = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ],
    raw: true
  });

  if (avgRating && avgRating.averageRating) {
    await Product.update(
      { rating: parseFloat(avgRating.averageRating).toFixed(1) },
      { where: { id: productId } }
    );
  }
};

/**
 * Helper function to update restaurant rating
 * @param {number} restaurantId - Restaurant ID
 */
const updateRestaurantRating = async (restaurantId) => {
  const avgRating = await Review.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ],
    include: [{
      model: Product,
      as: 'product',
      attributes: [],
      where: { restaurantId }
    }],
    raw: true
  });

  if (avgRating && avgRating.averageRating) {
    await Restaurant.update(
      { rating: parseFloat(avgRating.averageRating).toFixed(1) },
      { where: { id: restaurantId } }
    );
  }
};
 'product',