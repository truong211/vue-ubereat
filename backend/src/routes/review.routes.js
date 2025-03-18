const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', reviewController.getAllReviews);
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Protected routes (require authentication)
router.use(authMiddleware);

router.get('/user', reviewController.getUserReviews);
router.get('/dashboard/stats', restrictTo(['admin', 'restaurant']), reviewController.getReviewStats);

// Create a review
router.post('/',
  [
    body('orderId').isInt().withMessage('Order ID is required'),
    body('restaurantId').isInt().withMessage('Restaurant ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters')
  ],
  reviewController.createReview
);

// Update a review
router.put('/:id',
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters')
  ],
  reviewController.updateReview
);

// Delete a review
router.delete('/:id', reviewController.deleteReview);

// Restaurant owner respond to review
router.post('/:id/respond',
  restrictTo(['restaurant']),
  [
    body('response').isString().isLength({ min: 10, max: 1000 }).withMessage('Response must be between 10 and 1000 characters')
  ],
  reviewController.respondToReview
);

// Update restaurant response to review
router.put('/:id/respond',
  restrictTo(['restaurant']),
  [
    body('response').isString().isLength({ min: 10, max: 1000 }).withMessage('Response must be between 10 and 1000 characters')
  ],
  reviewController.respondToReview  // We can reuse the same controller method for updating
);

// Vote on a review (helpful/unhelpful)
router.post('/:id/vote',
  [
    body('isHelpful').isBoolean().withMessage('isHelpful must be a boolean value')
  ],
  reviewController.voteReview
);

// Report a review
router.post('/:id/report',
  [
    body('reason').isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other']),
    body('description').optional().isString().trim()
  ],
  reviewController.reportReview
);

// Upload review images
router.post('/:id/images',
  reviewController.uploadReviewImages
);

// Get review analytics
router.get('/analytics',
  restrictTo(['admin', 'restaurant']),
  reviewController.getReviewAnalytics
);

// Moderation routes (admin only)
router.get('/moderation',
  restrictTo(['admin', 'moderator']),
  reviewController.getPendingModeration
);

router.patch('/:id/moderate',
  restrictTo(['admin', 'moderator']),
  [
    body('moderationStatus').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
    body('moderationReason').optional().isString().trim()
  ],
  reviewController.moderateReview
);

module.exports = router;