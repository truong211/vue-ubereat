const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/reviews
 * @desc Get all reviews (with filtering options)
 * @access Public
 */
router.get('/', reviewController.getAllReviews);

/**
 * @route GET /api/reviews/product/:productId
 * @desc Get reviews for a specific product
 * @access Public
 */
router.get('/product/:productId', reviewController.getProductReviews);

/**
 * @route GET /api/reviews/restaurant/:restaurantId
 * @desc Get reviews for a specific restaurant
 * @access Public
 */
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

/**
 * @route GET /api/reviews/user
 * @desc Get reviews by the logged-in user
 * @access Private
 */
router.get('/user', authMiddleware, reviewController.getUserReviews);

/**
 * @route POST /api/reviews
 * @desc Create a new review
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  [
    body('orderId')
      .isInt()
      .withMessage('Order ID is required'),
    body('productId')
      .isInt()
      .withMessage('Product ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .withMessage('Comment must be a string')
  ],
  reviewController.createReview
);

/**
 * @route PUT /api/reviews/:id
 * @desc Update a review
 * @access Private
 */
router.put(
  '/:id',
  authMiddleware,
  [
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .withMessage('Comment must be a string')
  ],
  reviewController.updateReview
);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review
 * @access Private
 */
router.delete('/:id', authMiddleware, reviewController.deleteReview);

/**
 * @route GET /api/reviews/dashboard/stats
 * @desc Get review statistics for dashboard
 * @access Private/Admin
 */
router.get(
  '/dashboard/stats',
  authMiddleware,
  restrictTo('admin', 'restaurant'),
  reviewController.getReviewStats
);

module.exports = router;