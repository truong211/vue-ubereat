const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/orders
 * @desc Get user orders
 * @access Private
 */
router.get('/', orderController.getUserOrders);

/**
 * @route GET /api/orders/:id
 * @desc Get order details
 * @access Private
 */
router.get('/:id', orderController.getOrderDetails);

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Private
 */
router.post(
  '/',
  [
    body('restaurantId')
      .isInt()
      .withMessage('Restaurant ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.productId')
      .isInt()
      .withMessage('Product ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1 for each item'),
    body('deliveryAddress')
      .notEmpty()
      .withMessage('Delivery address is required'),
    body('paymentMethod')
      .isIn(['cash', 'credit_card', 'debit_card', 'e_wallet'])
      .withMessage('Valid payment method is required')
  ],
  orderController.createOrder
);

/**
 * @route PUT /api/orders/:id/cancel
 * @desc Cancel an order
 * @access Private
 */
router.put(
  '/:id/cancel',
  [
    body('cancellationReason')
      .notEmpty()
      .withMessage('Cancellation reason is required')
  ],
  orderController.cancelOrder
);

/**
 * @route GET /api/orders/restaurant/:restaurantId
 * @desc Get restaurant orders (for restaurant owners/staff)
 * @access Private/Restaurant
 */
router.get(
  '/restaurant/:restaurantId',
  restrictTo('admin', 'restaurant'),
  orderController.getRestaurantOrders
);

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status (for restaurant owners/staff)
 * @access Private/Restaurant
 */
router.put(
  '/:id/status',
  restrictTo('admin', 'restaurant'),
  [
    body('status')
      .isIn(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'])
      .withMessage('Valid status is required')
  ],
  orderController.updateOrderStatus
);

/**
 * @route POST /api/orders/:id/rate
 * @desc Rate an order
 * @access Private
 */
router.post(
  '/:id/rate',
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
  ],
  orderController.rateOrder
);

/**
 * @route GET /api/orders/dashboard/stats
 * @desc Get order statistics for dashboard
 * @access Private/Admin
 */
router.get(
  '/dashboard/stats',
  restrictTo('admin'),
  orderController.getOrderStats
);

module.exports = router;