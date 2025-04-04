const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const { validateReview } = require('../middleware/review.validator');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/reviews'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Public routes
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Comment out protected routes for now to get the server running
// Protected routes
// router.post('/', authMiddleware, uploadImages.array('images', 5), validateReview, reviewController.createReview);
// router.put('/:id', authMiddleware, uploadImages.array('images', 5), validateReview, reviewController.updateReview);
// router.delete('/:id', authMiddleware, reviewController.deleteReview);
// router.get('/check-eligibility/:restaurantId', authMiddleware, reviewController.checkEligibility);
// router.post('/:id/vote', authMiddleware, reviewController.voteReview);
// router.post('/:id/report', authMiddleware, reviewController.reportReview);

// Restaurant owner routes
// router.post('/:id/respond', authMiddleware, restrictTo('restaurant'), reviewController.respondToReview);
// router.put('/:id/respond', authMiddleware, restrictTo('restaurant'), reviewController.updateResponse);

// Admin/moderator routes
// router.post('/:id/moderate', authMiddleware, restrictTo('admin', 'moderator'), reviewController.moderateReview);
// router.get('/analytics', authMiddleware, restrictTo('admin', 'moderator', 'restaurant'), reviewController.getAnalytics);

module.exports = router;