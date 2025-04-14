const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');

const router = express.Router();

// Configure multer for product image uploads
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
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
  }
});

// Get all products with filters
router.get('/', productController.getAllProducts);

// Get recommended products - Moved BEFORE the :id route to fix routing issue
router.get('/recommended', productController.getRecommendedProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get product details with options
router.get('/:id/details', productController.getProductDetails);

// Create product
router.post('/',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  upload.single('image'),
  [
    body('name')
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('price')
      .notEmpty()
      .withMessage('Price is required')
      .isNumeric()
      .withMessage('Price must be a number')
      .custom(value => value >= 0)
      .withMessage('Price cannot be negative'),
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
      .withMessage('Discount price must be a number')
      .custom((value, { req }) => {
        if (value >= req.body.price) {
          throw new Error('Discount price must be less than regular price');
        }
        return true;
      }),
    body('spicyLevel')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Spicy level must be between 0 and 5')
      .isInt({ min: 0 })
      .withMessage('Preparation time must be a non-negative number'),
    body('nutritionalInfo')
      .optional()
      .custom(value => {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object';
        } catch (e) {
          throw new Error('Nutritional info must be a valid JSON object');
        }
      }),
    body('ingredients')
      .optional()
      .custom(value => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch (e) {
          throw new Error('Ingredients must be a valid JSON array');
        }
      }),
    body('allergens')
      .optional()
      .custom(value => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch (e) {
          throw new Error('Allergens must be a valid JSON array');
        }
      }),
    body('options')
      .optional()
      .custom(value => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch (e) {
          throw new Error('Options must be a valid JSON array');
        }
      })
  ],
  productController.createProduct
);

// Update product
router.patch('/:id',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  upload.single('image'),
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a number')
      .custom(value => value >= 0)
      .withMessage('Price cannot be negative'),
    body('categoryId')
      .optional()
      .isNumeric()
      .withMessage('Category ID must be a number'),
    body('discountPrice')
      .optional()
      .isNumeric()
      .withMessage('Discount price must be a number')
      .custom((value, { req }) => {
        if (value >= req.body.price) {
          throw new Error('Discount price must be less than regular price');
        }
        return true;
      })
  ],
  productController.updateProduct
);

// Delete product
router.delete('/:id',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  productController.deleteProduct
);

// Get product reviews
router.get('/:id/reviews', productController.getProductReviews);

module.exports = router;