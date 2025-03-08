const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route PATCH /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.patch(
  '/profile',
  [
    body('fullName')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Full name must be between 3 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('address')
      .optional()
      .isLength({ min: 5 })
      .withMessage('Address must be at least 5 characters')
  ],
  userController.updateProfile
);

/**
 * @route POST /api/users/profile/image
 * @desc Upload profile image
 * @access Private
 */
router.post(
  '/profile/image',
  upload.single('image'),
  userController.uploadProfileImage
);

/**
 * @route GET /api/users/addresses
 * @desc Get user addresses
 * @access Private
 */
router.get('/addresses', userController.getAddresses);

/**
 * @route POST /api/users/addresses
 * @desc Add new address
 * @access Private
 */
router.post(
  '/addresses',
  [
    body('name')
      .notEmpty()
      .withMessage('Address name is required'),
    body('addressLine1')
      .notEmpty()
      .withMessage('Address line 1 is required'),
    body('city')
      .notEmpty()
      .withMessage('City is required'),
    body('state')
      .notEmpty()
      .withMessage('State is required'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code is required')
  ],
  userController.addAddress
);

/**
 * @route PATCH /api/users/addresses/:id
 * @desc Update address
 * @access Private
 */
router.patch(
  '/addresses/:id',
  [
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Address name cannot be empty'),
    body('addressLine1')
      .optional()
      .notEmpty()
      .withMessage('Address line 1 cannot be empty'),
    body('city')
      .optional()
      .notEmpty()
      .withMessage('City cannot be empty'),
    body('state')
      .optional()
      .notEmpty()
      .withMessage('State cannot be empty'),
    body('postalCode')
      .optional()
      .notEmpty()
      .withMessage('Postal code cannot be empty')
  ],
  userController.updateAddress
);

/**
 * @route DELETE /api/users/addresses/:id
 * @desc Delete address
 * @access Private
 */
router.delete('/addresses/:id', userController.deleteAddress);

/**
 * @route GET /api/users/orders
 * @desc Get user orders
 * @access Private
 */
router.get('/orders', userController.getOrders);

/**
 * @route GET /api/users/orders/:id
 * @desc Get order details
 * @access Private
 */
router.get('/orders/:id', userController.getOrderDetails);

module.exports = router; 