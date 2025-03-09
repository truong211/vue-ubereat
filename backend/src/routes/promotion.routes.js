const express = require('express');
const { body } = require('express-validator');
const promotionController = require('../controllers/promotion.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/promotions
 * @desc Get all active promotions
 * @access Public
 */
router.get('/', promotionController.getActivePromotions);

/**
 * @route GET /api/promotions/:id
 * @desc Get promotion details
 * @access Public
 */
router.get('/:id', promotionController.getPromotionDetails);

/**
 * @route POST /api/promotions/validate
 * @desc Validate a promotion code
 * @access Private
 */
router.post(
  '/validate',
  authMiddleware,
  [
    body('code')
      .notEmpty()
      .withMessage('Promotion code is required'),
    body('restaurantId')
      .optional()
      .isInt()
      .withMessage('Restaurant ID must be an integer'),
    body('orderAmount')
      .isNumeric()
      .withMessage('Order amount is required')
  ],
  promotionController.validatePromotion
);

/**
 * @route GET /api/promotions/admin/all
 * @desc Get all promotions (including inactive) for admin
 * @access Private/Admin
 */
router.get(
  '/admin/all',
  authMiddleware,
  restrictTo('admin', 'restaurant'),
  promotionController.getAllPromotions
);

/**
 * @route POST /api/promotions
 * @desc Create a new promotion
 * @access Private/Admin
 */
router.post(
  '/',
  authMiddleware,
  restrictTo('admin', 'restaurant'),
  [
    body('code')
      .notEmpty()
      .withMessage('Promotion code is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Code must be between 3 and 50 characters'),
    body('description')
      .optional(),
    body('discountType')
      .isIn(['percentage', 'fixed_amount'])
      .withMessage('Discount type must be either percentage or fixed_amount'),
    body('discountValue')
      .isNumeric()
      .withMessage('Discount value is required'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date is required'),
    body('minOrderValue')
      .optional()
      .isNumeric()
      .withMessage('Minimum order value must be a number'),
    body('maxDiscount')
      .optional()
      .isNumeric()
      .withMessage('Maximum discount must be a number'),
    body('restaurantId')
      .optional()
      .isInt()
      .withMessage('Restaurant ID must be an integer'),
    body('productIds')
      .optional()
      .isArray()
      .withMessage('Product IDs must be an array')
  ],
  promotionController.createPromotion
);

/**
 * @route PUT /api/promotions/:id
 * @desc Update a promotion
 * @access Private/Admin
 */
router.put(
  '/:id',
  authMiddleware,
  restrictTo('admin', 'restaurant'),
  [
    body('code')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Code must be between 3 and 50 characters'),
    body('description')
      .optional(),
    body('discountType')
      .optional()
      .isIn(['percentage', 'fixed_amount'])
      .withMessage('Discount type must be either percentage or fixed_amount'),
    body('discountValue')
      .optional()
      .isNumeric()
      .withMessage('Discount value must be a number'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Valid end date is required'),
    body('minOrderValue')
      .optional()
      .isNumeric()
      .withMessage('Minimum order value must be a number'),
    body('maxDiscount')
      .optional()
      .isNumeric()
      .withMessage('Maximum discount must be a number'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    body('productIds')
      .optional()
      .isArray()
      .withMessage('Product IDs must be an array')
  ],
  promotionController.updatePromotion
);

/**
 * @route DELETE /api/promotions/:id
 * @desc Delete a promotion
 * @access Private/Admin
 */
router.delete(
  '/:id',
  authMiddleware,
  restrictTo('admin', 'restaurant'),
  promotionController.deletePromotion
);

/**
 * @route GET /api/promotions/restaurant/:restaurantId
 * @desc Get promotions for a specific restaurant
 * @access Public
 */
router.get('/restaurant/:restaurantId', promotionController.getRestaurantPromotions);

/**
 * @route GET /api/promotions/product/:productId
 * @desc Get promotions for a specific product
 * @access Public
 */
router.get('/product/:productId', promotionController.getProductPromotions);

module.exports = router;