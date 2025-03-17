const express = require('express');
const { body } = require('express-validator');
const restaurantController = require('../controllers/restaurant.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/restaurants'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `restaurant-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Special routes that need to be defined before the param middleware
// Get featured restaurants
router.get('/featured', restaurantController.getFeaturedRestaurants);

// Get popular restaurants
router.get('/popular', restaurantController.getPopularRestaurants);

// Search restaurants by location
router.get('/search', restaurantController.searchRestaurantsByLocation);

/**
 * @route GET /api/restaurants
 * @desc Get all restaurants
 * @access Public
 */
router.get('/', restaurantController.getAllRestaurants);

/**
 * @route GET /api/restaurants/:id
 * @desc Get restaurant by ID
 * @access Public
 */
router.get('/:id', restaurantController.getRestaurantById);

/**
 * @route POST /api/restaurants
 * @desc Create restaurant
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  restrictTo('owner', 'admin'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  [
    body('name')
      .notEmpty()
      .withMessage('Restaurant name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    body('address')
      .notEmpty()
      .withMessage('Address is required'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('deliveryFee')
      .optional()
      .isNumeric()
      .withMessage('Delivery fee must be a number'),
    body('minOrderAmount')
      .optional()
      .isNumeric()
      .withMessage('Minimum order amount must be a number')
  ],
  restaurantController.createRestaurant
);

/**
 * @route PATCH /api/restaurants/:id
 * @desc Update restaurant
 * @access Private (Restaurant Owner)
 */
router.patch(
  '/:id',
  authMiddleware,
  restrictTo('owner', 'admin', 'restaurant'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  [
    body('name')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be between 3 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('deliveryFee')
      .optional()
      .isNumeric()
      .withMessage('Delivery fee must be a number'),
    body('minOrderAmount')
      .optional()
      .isNumeric()
      .withMessage('Minimum order amount must be a number')
  ],
  restaurantController.updateRestaurant
);

/**
 * @route DELETE /api/restaurants/:id
 * @desc Delete restaurant
 * @access Private (Restaurant Owner or Admin)
 */
router.delete(
  '/:id',
  authMiddleware,
  restrictTo('owner', 'admin', 'restaurant'),
  restaurantController.deleteRestaurant
);

/**
 * @route GET /api/restaurants/:id/menu
 * @desc Get restaurant menu
 * @access Public
 */
router.get('/:id/menu', restaurantController.getRestaurantMenu);

/**
 * @route GET /api/restaurants/:id/reviews
 * @desc Get restaurant reviews
 * @access Public
 */
router.get('/:id/reviews', restaurantController.getRestaurantReviews);

module.exports = router;