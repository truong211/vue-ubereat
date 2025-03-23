const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth.middleware');
const { uploadImages } = require('../middleware/upload.middleware');
const { validateReview } = require('../middleware/review.validator');

// Public routes
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Protected routes
router.use(auth);

// Customer routes
router.post('/', uploadImages.array('images', 5), validateReview, reviewController.createReview);
router.put('/:id', uploadImages.array('images', 5), validateReview, reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);
router.get('/check-eligibility/:restaurantId', reviewController.checkEligibility);
router.post('/:id/vote', reviewController.voteReview);
router.post('/:id/report', reviewController.reportReview);

// Restaurant owner routes
router.post('/:id/respond', auth(['restaurant']), reviewController.respondToReview);
router.put('/:id/respond', auth(['restaurant']), reviewController.updateResponse);

// Admin/moderator routes
router.post('/:id/moderate', auth(['admin', 'moderator']), reviewController.moderateReview);
router.get('/analytics', auth(['admin', 'moderator', 'restaurant']), reviewController.getAnalytics);

module.exports = router;