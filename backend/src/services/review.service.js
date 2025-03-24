const { Review, Restaurant, User, OrderItem, ReviewVote, ReviewReport, ItemRating, Product } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('./notification.service');

class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data, userId) {
    const { restaurantId, orderId, rating, comment, images = [], itemRatings = [] } = data;

    const review = await Review.create({
      userId,
      restaurantId,
      orderId,
      rating,
      comment,
      images,
      isVisible: true,
      moderationStatus: this.shouldRequireModeration(data) ? 'pending' : 'approved'
    });

    // Add item-specific ratings if provided
    if (itemRatings && itemRatings.length > 0) {
      await this.addItemRatings(review.id, itemRatings);
    }

    // Send notification to restaurant owner
    await this.notifyRestaurantOwner(review);

    return review;
  }

  /**
   * Add item-specific ratings
   */
  async addItemRatings(reviewId, itemRatings) {
    // Create item ratings in bulk
    await Promise.all(
      itemRatings.map(async (item) => {
        await ItemRating.create({
          reviewId,
          orderItemId: item.orderItemId,
          productId: item.productId,
          rating: item.rating,
          comment: item.comment || null,
          aspects: item.aspects || [],
          images: item.images || []
        });
      })
    );
  }

  /**
   * Update an existing review
   */
  async updateReview(reviewId, data, userId) {
    const review = await Review.findOne({
      where: { id: reviewId, userId }
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const updated = await review.update({
      rating: data.rating || review.rating,
      comment: data.comment || review.comment,
      images: data.images || review.images
    });

    // Update restaurant rating statistics
    await this.updateRestaurantStats(review.restaurantId);

    return updated;
  }

  /**
   * Handle review voting
   */
  async handleVote(reviewId, userId, isHelpful) {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    let vote = await ReviewVote.findOne({
      where: { reviewId, userId }
    });

    if (vote) {
      if (vote.isHelpful === isHelpful) {
        await vote.destroy();
      } else {
        vote.isHelpful = isHelpful;
        await vote.save();
      }
    } else {
      vote = await ReviewVote.create({
        reviewId,
        userId,
        isHelpful
      });
    }

    await this.updateVoteCounts(reviewId);
    return await Review.findByPk(reviewId);
  }

  /**
   * Handle review reporting
   */
  async reportReview(reviewId, userId, data) {
    const { reason, description } = data;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const existingReport = await ReviewReport.findOne({
      where: { reviewId, userId }
    });

    if (existingReport) {
      throw new Error('You have already reported this review');
    }

    const report = await ReviewReport.create({
      reviewId,
      userId,
      reason,
      description,
      status: 'pending'
    });

    // Check if review should be hidden due to multiple reports
    const reportCount = await ReviewReport.count({
      where: { reviewId, status: 'pending' }
    });

    if (reportCount >= 3) {
      await review.update({
        isVisible: false,
        moderationStatus: 'pending'
      });
    }

    // Notify moderators
    await NotificationService.notifyModerators({
      type: 'review_report',
      title: 'New Review Report',
      message: `A review has been reported for ${reason}`,
      data: {
        reviewId,
        reportId: report.id
      }
    });

    return report;
  }

  /**
   * Handle restaurant owner response
   */
  async respondToReview(reviewId, userId, response) {
    const review = await Review.findByPk(reviewId, {
      include: [{
        model: Restaurant,
        as: 'restaurant'
      }]
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      where: { 
        id: review.restaurantId, 
        ownerId: userId 
      }
    });

    if (!restaurant) {
      throw new Error('Not authorized to respond to this review');
    }

    await review.update({
      response,
      responseDate: new Date()
    });

    // Notify the reviewer
    await NotificationService.createNotification({
      userId: review.userId,
      type: 'review_response',
      title: 'Response to Your Review',
      message: `${restaurant.name} has responded to your review`,
      data: {
        reviewId,
        restaurantId: restaurant.id
      }
    });

    return review;
  }

  /**
   * Moderate a review
   */
  async moderateReview(reviewId, moderatorId, data) {
    const { status, reason } = data;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await review.update({
      moderationStatus: status,
      moderationReason: reason || null,
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      isVisible: status === 'approved'
    });

    // Update report statuses
    if (status !== 'pending') {
      await ReviewReport.update(
        {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: moderatorId
        },
        {
          where: {
            reviewId,
            status: 'pending'
          }
        }
      );
    }

    // Notify the reviewer
    await NotificationService.createNotification({
      userId: review.userId,
      type: 'review_moderation',
      title: status === 'approved' ? 'Review Approved' : 'Review Rejected',
      message: status === 'approved'
        ? 'Your review has been approved'
        : `Your review has been rejected: ${reason}`,
      data: {
        reviewId,
        status
      }
    });

    return review;
  }

  /**
   * Get review analytics
   */
  async getAnalytics(restaurantId = null) {
    const whereClause = restaurantId ? { restaurantId } : {};

    // Get overall stats
    const [overallStats, ratingDistribution, monthlyTrends] = await Promise.all([
      Review.findOne({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'average']
        ],
        raw: true
      }),
      Review.findAll({
        where: whereClause,
        attributes: [
          'rating',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['rating'],
        order: [['rating', 'DESC']],
        raw: true
      }),
      Review.findAll({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
        raw: true
      })
    ]);

    return {
      overall: {
        total: parseInt(overallStats.total),
        average: parseFloat(overallStats.average).toFixed(1)
      },
      distribution: ratingDistribution.reduce((acc, curr) => {
        acc[curr.rating] = parseInt(curr.count);
        return acc;
      }, {}),
      trends: monthlyTrends.map(trend => ({
        month: trend.month,
        avgRating: parseFloat(trend.avgRating).toFixed(1),
        count: parseInt(trend.count)
      }))
    };
  }

  /**
   * Get item ratings for a review
   */
  async getItemRatings(reviewId) {
    return await ItemRating.findAll({
      where: { reviewId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'image_url']
        }
      ]
    });
  }

  /**
   * Get reviews with item ratings
   */
  async getReviewsWithItemRatings(options) {
    const reviews = await Review.findAll(options);
    
    // Enrich reviews with item ratings
    const reviewsWithItems = await Promise.all(
      reviews.map(async (review) => {
        const reviewObj = review.toJSON();
        reviewObj.itemRatings = await this.getItemRatings(review.id);
        return reviewObj;
      })
    );
    
    return reviewsWithItems;
  }

  /**
   * Private helper methods
   */

  async updateVoteCounts(reviewId) {
    const [helpful, unhelpful] = await Promise.all([
      ReviewVote.count({
        where: { reviewId, isHelpful: true }
      }),
      ReviewVote.count({
        where: { reviewId, isHelpful: false }
      })
    ]);

    await Review.update(
      { helpfulVotes: helpful, unhelpfulVotes: unhelpful },
      { where: { id: reviewId } }
    );
  }

  async updateRestaurantStats(restaurantId) {
    const stats = await Review.findOne({
      where: { restaurantId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      raw: true
    });

    await Restaurant.update(
      {
        rating: parseFloat(stats.average).toFixed(1),
        reviewCount: parseInt(stats.total)
      },
      { where: { id: restaurantId } }
    );
  }

  async notifyRestaurantOwner(review) {
    const restaurant = await Restaurant.findByPk(review.restaurantId, {
      include: [{
        model: User,
        as: 'owner'
      }]
    });

    if (restaurant?.owner) {
      await NotificationService.createNotification({
        userId: restaurant.owner.id,
        type: 'new_review',
        title: 'New Review',
        message: `Your restaurant received a ${review.rating}-star review`,
        data: {
          reviewId: review.id,
          restaurantId: restaurant.id
        }
      });
    }
  }

  shouldRequireModeration(review) {
    // Check for potentially problematic content
    const sensitiveTerms = ['hate', 'kill', 'disgusting', 'awful', 'terrible'];
    
    if (review.comment) {
      const commentLower = review.comment.toLowerCase();
      
      // Check sensitive terms
      if (sensitiveTerms.some(term => commentLower.includes(term))) {
        return true;
      }
      
      // Very negative review with long comment
      if (review.rating === 1 && review.comment.length > 200) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = new ReviewService();