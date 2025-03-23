const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');
const menuItemController = require('../controllers/menuItem.controller');
const { body } = require('express-validator');

// Configure multer for menu item image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/menu-items');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Category routes
router.get('/categories', categoryController.getAllCategories);
router.post(
  '/categories',
  protect,
  restrictTo('restaurant', 'admin'),
  [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters'),
    body('restaurantId')
      .notEmpty()
      .withMessage('Restaurant ID is required')
      .isNumeric()
      .withMessage('Restaurant ID must be a number')
  ],
  categoryController.createCategory
);
router.patch(
  '/categories/:id',
  protect,
  restrictTo('restaurant', 'admin'),
  categoryController.updateCategory
);
router.delete(
  '/categories/:id',
  protect,
  restrictTo('restaurant', 'admin'),
  categoryController.deleteCategory
);

// Menu item routes
router.get('/items', menuItemController.getAllMenuItems);
router.post(
  '/items',
  protect,
  restrictTo('restaurant', 'admin'),
  upload.single('image'),
  [
    body('name')
      .notEmpty()
      .withMessage('Item name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Item name must be between 2 and 100 characters'),
    body('price')
      .notEmpty()
      .withMessage('Price is required')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('categoryId')
      .notEmpty()
      .withMessage('Category ID is required')
      .isNumeric()
      .withMessage('Category ID must be a number'),
    body('sizes')
      .optional()
      .isArray()
      .withMessage('Sizes must be an array'),
    body('toppings')
      .optional()
      .isArray()
      .withMessage('Toppings must be an array')
  ],
  menuItemController.createMenuItem
);
router.patch(
  '/items/:id',
  protect,
  restrictTo('restaurant', 'admin'),
  upload.single('image'),
  menuItemController.updateMenuItem
);
router.delete(
  '/items/:id',
  protect,
  restrictTo('restaurant', 'admin'),
  menuItemController.deleteMenuItem
);
router.patch(
  '/items/:id/availability',
  protect,
  restrictTo('restaurant', 'admin'),
  menuItemController.toggleAvailability
);

module.exports = router;