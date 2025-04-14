const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get users (filtered by roles if specified)
 * @access Public with optional auth
 */
router.get('/', authMiddleware, userController.getUsers);

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

/**
 * @route GET /api/users/payment-methods
 * @desc Get user payment methods
 * @access Private
 */
router.get('/payment-methods', (req, res) => {
  // Return empty array for now as this is a placeholder
  res.status(200).json({
    status: 'success',
    data: {
      paymentMethods: []
    }
  });
});

/**
 * @route POST /api/users/payment-methods
 * @desc Add new payment method
 * @access Private
 */
router.post(
  '/payment-methods',
  [
    body('type')
      .notEmpty()
      .withMessage('Payment method type is required')
      .isIn(['credit_card', 'debit_card', 'paypal'])
      .withMessage('Invalid payment method type'),
    body('cardNumber')
      .optional()
      .isCreditCard()
      .withMessage('Invalid card number'),
    body('expiryDate')
      .optional()
      .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
      .withMessage('Expiry date should be in MM/YY format')
  ],
  (req, res) => {
    // Return success for now as this is a placeholder
    res.status(201).json({
      status: 'success',
      data: {
        paymentMethod: {
          id: Date.now(),
          userId: req.user.id,
          type: req.body.type,
          cardNumber: req.body.cardNumber ? `xxxx-xxxx-xxxx-${req.body.cardNumber.slice(-4)}` : null,
          expiryDate: req.body.expiryDate || null,
          isDefault: req.body.isDefault || false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    });
  }
);

/**
 * @route DELETE /api/users/payment-methods/:id
 * @desc Delete payment method
 * @access Private
 */
router.delete('/payment-methods/:id', (req, res) => {
  // Return success for now as this is a placeholder
  res.status(204).send();
});

module.exports = router; 