const { validationResult } = require('express-validator');
const { Review, User, Product, Order, Restaurant, ReviewVote, ReviewReport } = require('../models');
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
    const { rating, sort = 'recent', page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (rating) {
      filter.rating = rating;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Define sort options
    let order = [['createdAt', 'DESC']];
    switch (sort) {
      case 'rating-high':
        order = [['rating', 'DESC']];
        break;
      case 'rating-low':
        order = [['rating', 'ASC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
    }

    // Get reviews
    const reviews = await Review.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo']
        }
      ],
      order,
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
 * Get restaurant reviews with stats
 * @route GET /api/reviews/restaurant/:restaurantId
 * @access Public
 */
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Define sort options
    let order = [['createdAt', 'DESC']];
    switch (sort) {
      case 'rating-high':
        order = [['rating', 'DESC']];
        break;
      case 'rating-low':
        order = [['rating', 'ASC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
    }

    // Get reviews
    const reviews = await Review.findAndCountAll({
      where: { restaurantId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber']
        }
      ],
      order,
      limit: parseInt(limit),
      offset
    });

    // Calculate rating stats
    const stats = await Review.findAll({
      where: { restaurantId },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['rating']
    });

    // Calculate average rating
    const avgRating = await Review.findOne({
      where: { restaurantId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      raw: true
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        reviews: reviews.rows,
        stats: {
          distribution: stats,
          average: avgRating.average ? parseFloat(avgRating.average).toFixed(1) : 0,
          total: avgRating.total
        }
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
 * Create a review
 * @route POST /api/reviews
 * @access Private
 */
exports.createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, restaurantId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId,
        status: 'delivered'
      }
    });

    if (!order) {
      return next(new AppError('Order not found or not eligible for review', 404));
    }

    // Check if user already reviewed this order
    const existingReview = await Review.findOne({
      where: {
        userId,
        orderId
      }
    });

    if (existingReview) {
      return next(new AppError('You have already reviewed this order', 400));
    }

    // Create review
    const review = await Review.create({
      userId,
      orderId,
      restaurantId,
      rating,
      comment
    });

    // Update restaurant rating
    await updateRestaurantRating(restaurantId);

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
    review.comment = comment || review.comment;
    await review.save();

    // Update restaurant rating
    await updateRestaurantRating(review.restaurantId);

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

    const restaurantId = review.restaurantId;

    // Delete review
    await review.destroy();

    // Update restaurant rating
    await updateRestaurantRating(restaurantId);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restaurant owner respond to review
 * @route POST /api/reviews/:id/respond
 * @access Private (Restaurant Owner)
 */
exports.respondToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    // Find review
    const review = await Review.findOne({
      where: { id },
      include: [{
        model: Restaurant,
        as: 'restaurant'
      }]
    });

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Check if user is restaurant owner
    if (review.restaurant.userId !== req.user.id) {
      return next(new AppError('Not authorized to respond to this review', 403));
    }

    // Update review with response
    review.response = response;
    review.responseDate = new Date();
    await review.save();

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
 * Vote a review as helpful
 * @route POST /api/reviews/:id/vote
 * @access Private
 */
exports.voteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(id);
    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Get existing votes or initialize empty array
    const votes = review.votes || [];
    const existingVoteIndex = votes.findIndex(vote => vote.userId === userId);

    if (existingVoteIndex >= 0) {
      // Update existing vote
      votes[existingVoteIndex].isHelpful = isHelpful;
    } else {
      // Add new vote
      votes.push({ userId, isHelpful });
    }

    review.votes = votes;
    await review.save();

    // Calculate helpful votes count
    const helpfulCount = votes.filter(vote => vote.isHelpful).length;

    res.status(200).json({
      status: 'success',
      data: {
        helpfulCount,
        userVote: isHelpful
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload review images
 * @route POST /api/reviews/:id/images
 * @access Private
 */
exports.uploadReviewImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = req.files;

    if (!images || images.length === 0) {
      return next(new AppError('No images uploaded', 400));
    }

    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Process and store images
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        // Upload image to storage service and get URL
        const url = await uploadToStorage(image);
        return url;
      })
    );

    // Update review with new images
    const existingImages = review.images || [];
    review.images = [...existingImages, ...imageUrls];
    await review.save();

    res.status(200).json({
      status: 'success',
      data: {
        images: review.images
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get review report analytics
 * @route GET /api/reviews/analytics
 * @access Private (Admin/Restaurant Owner)
 */
exports.getReviewAnalytics = async (req, res, next) => {
  try {
    let whereClause = {};
    
    // If restaurant owner, filter by their restaurant
    if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
      if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
      }
      whereClause.restaurantId = restaurant.id;
    }

    // Get review trends
    const trends = await Review.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Get sentiment distribution
    const sentimentStats = await Review.findAll({
      where: whereClause,
      attributes: [
        [sequelize.literal(`
          CASE 
            WHEN rating >= 4 THEN 'positive'
            WHEN rating = 3 THEN 'neutral'
            ELSE 'negative'
          END
        `), 'sentiment'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sentiment'],
      raw: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        trends,
        sentimentStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to upload images (implement based on your storage service)
const uploadToStorage = async (image) => {
  // Implement image upload to your preferred storage service
  // Return the URL of the uploaded image
  // This is a placeholder implementation
  return `https://storage.example.com/${image.filename}`;
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

/**
 * Vote on a review
 * @route POST /api/reviews/:id/vote
 * @access Private
 */
exports.voteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(id);
    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Check if user has already voted
    let vote = await ReviewVote.findOne({
      where: { userId, reviewId: id }
    });

    if (vote) {
      // Update existing vote
      vote.isHelpful = isHelpful;
      await vote.save();
    } else {
      // Create new vote
      vote = await ReviewVote.create({
        userId,
        reviewId: id,
        isHelpful
      });
    }

    // Get updated vote counts
    const helpfulCount = await ReviewVote.count({
      where: { reviewId: id, isHelpful: true }
    });
    const unhelpfulCount = await ReviewVote.count({
      where: { reviewId: id, isHelpful: false }
    });

    res.status(200).json({
      status: 'success',
      data: {
        helpfulCount,
        unhelpfulCount,
        userVote: isHelpful
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report a review
 * @route POST /api/reviews/:id/report
 * @access Private
 */
exports.reportReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(id);
    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Check if user has already reported
    const existingReport = await ReviewReport.findOne({
      where: { userId, reviewId: id }
    });

    if (existingReport) {
      return next(new AppError('You have already reported this review', 400));
    }

    const report = await ReviewReport.create({
      userId,
      reviewId: id,
      reason,
      description
    });

    // If review gets multiple reports, hide it pending moderation
    const reportCount = await ReviewReport.count({
      where: { reviewId: id }
    });

    if (reportCount >= 3) {
      review.isVisible = false;
      await review.save();
    }

    res.status(201).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get review analytics
 * @route GET /api/reviews/analytics
 * @access Private (Admin/Restaurant Owner)
 */
exports.getReviewAnalytics = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;

    // Verify user has access to restaurant data
    if (restaurantId) {
      const restaurant = await Restaurant.findByPk(restaurantId);
      if (!restaurant || (restaurant.userId !== req.user.id && req.user.role !== 'admin')) {
        return next(new AppError('Not authorized to view this restaurant\'s analytics', 403));
      }
    }

    const whereClause = restaurantId ? { restaurantId } : {};

    // Get overall stats
    const totalReviews = await Review.count({ where: whereClause });
    const averageRating = await Review.findOne({
      where: whereClause,
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']]
    });

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: whereClause,
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: 'rating',
      order: [['rating', 'DESC']]
    });

    // Get trend over time
    const monthlyTrend = await Review.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
      limit: 12
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalReviews,
        averageRating: averageRating.get('avgRating'),
        ratingDistribution,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};