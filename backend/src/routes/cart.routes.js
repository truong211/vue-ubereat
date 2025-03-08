const express = require('express');
const { body } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/cart
 * @desc Get user cart
 * @access Private
 */
router.get('/', cartController.getCart);

/**
 * @route POST /api/cart
 * @desc Add item to cart
 * @access Private
 */
router.post(
  '/',
  [
    body('productId')
      .notEmpty()
      .withMessage('Product ID is required')
      .isNumeric()
      .withMessage('Product ID must be a number'),
    body('quantity')
      .notEmpty()
      .withMessage('Quantity is required')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1')
  ],
  cartController.addToCart
);

/**
 * @route PATCH /api/cart/:id
 * @desc Update cart item
 * @access Private
 */
router.patch(
  '/:id',
  [
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1')
  ],
  cartController.updateCartItem
);

/**
 * @route DELETE /api/cart/:id
 * @desc Remove item from cart
 * @access Private
 */
router.delete('/:id', cartController.removeFromCart);

/**
 * @route DELETE /api/cart
 * @desc Clear cart
 * @access Private
 */
router.delete('/', cartController.clearCart);

module.exports = router; 