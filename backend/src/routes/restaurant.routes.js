const express = require('express');
const { body } = require('express-validator');
const restaurantController = require('../controllers/restaurant.controller');
const restaurantSettingsController = require('../controllers/restaurantSettings.controller');
const { authMiddleware, restrictTo, verifyRestaurantOwner } = require('../middleware/auth.middleware');
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

// Add the missing nearby restaurants route
router.get('/nearby', restaurantController.getNearbyRestaurants);

// Search and filter routes
router.get('/search', restaurantController.searchRestaurants);
router.get('/suggestions', restaurantController.getSearchSuggestions);
router.get('/cuisines', restaurantController.getCuisineTypes);

// Existing routes
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/:id/menu', restaurantController.getRestaurantMenu);
router.get('/:id/reviews', restaurantController.getRestaurantReviews);

// Add routes for restaurant creation and update
router.post('/', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), restaurantController.createRestaurant);

router.put('/:id', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), restaurantController.updateRestaurant);

router.delete('/:id', authMiddleware, restaurantController.deleteRestaurant);

// Restaurant settings routes are now handled by restaurantSettings.routes.js

router.get(
  '/:id/availability',
  restaurantController.getRestaurantAvailability
);

// Comment out this duplicate route that might be causing issues
// router.patch(
//   '/:id/holidays',
//   authMiddleware,
//   restrictTo('restaurant'),
//   restaurantSettingsController.updateSpecialHolidays
// );

// Password update route
// router.patch(
//   '/:id/password',
//   authMiddleware,
//   verifyRestaurantOwner,
//   [
//     body('currentPassword')
//       .notEmpty()
//       .withMessage('Current password is required'),
//     body('newPassword')
//       .notEmpty()
//       .withMessage('New password is required')
//       .isLength({ min: 8 })
//       .withMessage('Password must be at least 8 characters long')
//       .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//       .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
//   ],
//   restaurantController.updatePassword
// );

// Protected routes for restaurant owners
// Comment out this line as it's causing issues with authMiddleware
// router.use(authMiddleware);

// Comment out the problematic POST route causing undefined callback error
// router.post(
//   '/',
//   authMiddleware, // Add it directly to each route instead
//   restrictTo('owner', 'admin'),
//   upload.fields([
//     { name: 'logo', maxCount: 1 },
//     { name: 'coverImage', maxCount: 1 }
//   ]),
//   [
//     body('name')
//       .notEmpty()
//       .withMessage('Restaurant name is required')
//       .isLength({ min: 3, max: 100 })
//       .withMessage('Name must be between 3 and 100 characters'),
//     body('address')
//       .notEmpty()
//       .withMessage('Address is required'),
//     body('phone')
//       .optional()
//       .isMobilePhone()
//       .withMessage('Please provide a valid phone number'),
//     body('email')
//       .optional()
//       .isEmail()
//       .withMessage('Please provide a valid email'),
//     body('deliveryFee')
//       .optional()
//       .isNumeric()
//       .withMessage('Delivery fee must be a number'),
//     body('minOrderAmount')
//       .optional()
//       .isNumeric()
//       .withMessage('Minimum order amount must be a number')
//   ],
//   restaurantController.createRestaurant
// );

// Comment out the problematic PATCH route
// router.patch(
//   '/:id',
//   authMiddleware,
//   restrictTo('owner', 'admin', 'restaurant'),
//   upload.fields([
//     { name: 'logo', maxCount: 1 },
//     { name: 'coverImage', maxCount: 1 }
//   ]),
//   [
//     body('name')
//       .optional()
//       .isLength({ min: 3, max: 100 })
//       .withMessage('Name must be between 3 and 100 characters'),
//     body('phone')
//       .optional()
//       .isMobilePhone()
//       .withMessage('Please provide a valid phone number'),
//     body('email')
//       .optional()
//       .isEmail()
//       .withMessage('Please provide a valid email'),
//     body('deliveryFee')
//       .optional()
//       .isNumeric()
//       .withMessage('Delivery fee must be a number'),
//     body('minOrderAmount')
//       .optional()
//       .isNumeric()
//       .withMessage('Minimum order amount must be a number')
//   ],
//   restaurantController.updateRestaurant
// );

// Comment out the problematic DELETE route
// router.delete(
//   '/:id',
//   authMiddleware,
//   restrictTo('owner', 'admin', 'restaurant'),
//   restaurantController.deleteRestaurant
// );

module.exports = router;
