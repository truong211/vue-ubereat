const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/categories'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `category-${uniqueSuffix}${path.extname(file.originalname)}`);
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
 * @route GET /api/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route GET /api/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route POST /api/categories
 * @desc Create category
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
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('restaurantId')
      .notEmpty()
      .withMessage('Restaurant ID is required')
      .isNumeric()
      .withMessage('Restaurant ID must be a number')
  ],
  categoryController.createCategory
);

/**
 * @route PATCH /api/categories/:id
 * @desc Update category
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
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('displayOrder')
      .optional()
      .isNumeric()
      .withMessage('Display order must be a number')
  ],
  categoryController.updateCategory
);

/**
 * @route DELETE /api/categories/:id
 * @desc Delete category
 * @access Private (Restaurant Owner)
 */
router.delete(
  '/:id',
  authMiddleware,
  restrictTo('restaurant', 'admin'),
  categoryController.deleteCategory
);

module.exports = router; 