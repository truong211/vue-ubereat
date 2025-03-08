const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
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

/**
 * @route GET /api/products
 * @desc Get all products
 * @access Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route GET /api/products/:id
 * @desc Get product by ID
 * @access Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route POST /api/products
 * @desc Create product
 * @access Private (Restaurant Owner)
 */
router.post(
  '/',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  upload.single('image'),
  [
    body('name')
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('price')
      .notEmpty()
      .withMessage('Price is required')
      .isNumeric()
      .withMessage('Price must be a number'),
    body('restaurantId')
      .notEmpty()
      .withMessage('Restaurant ID is required')
      .isNumeric()
      .withMessage('Restaurant ID must be a number'),
    body('categoryId')
      .optional()
      .isNumeric()
      .withMessage('Category ID must be a number'),
    body('discountPrice')
      .optional()
      .isNumeric()
      .withMessage('Discount price must be a number'),
    body('spicyLevel')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Spicy level must be between 0 and 5'),
    body('preparationTime')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Preparation time must be a positive number')
  ],
  productController.createProduct
);

/**
 * @route PATCH /api/products/:id
 * @desc Update product
 * @access Private (Restaurant Owner)
 */
router.patch(
  '/:id',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  upload.single('image'),
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a number'),
    body('categoryId')
      .optional()
      .isNumeric()
      .withMessage('Category ID must be a number'),
    body('discountPrice')
      .optional()
      .isNumeric()
      .withMessage('Discount price must be a number'),
    body('spicyLevel')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Spicy level must be between 0 and 5'),
    body('preparationTime')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Preparation time must be a positive number'),
    body('status')
      .optional()
      .isIn(['available', 'unavailable'])
      .withMessage('Status must be either available or unavailable')
  ],
  productController.updateProduct
);

/**
 * @route DELETE /api/products/:id
 * @desc Delete product
 * @access Private (Restaurant Owner)
 */
router.delete(
  '/:id',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  productController.deleteProduct
);

/**
 * @route GET /api/products/:id/reviews
 * @desc Get product reviews
 * @access Public
 */
router.get('/:id/reviews', productController.getProductReviews);

module.exports = router; 