const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes

// Protected routes
router.use(authMiddleware);

// Customer routes
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderDetails);

router.post('/', [
  body('paymentMethod')
    .isIn(['cash', 'card', 'momo', 'zalopay'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
  body('deliveryInstructions')
    .optional()
    .isString()
    .withMessage('Ghi chú giao hàng không hợp lệ')
], orderController.createOrder);

router.patch('/:id/cancel', [
  body('cancellationReason')
    .notEmpty()
    .withMessage('Vui lòng cung cấp lý do hủy đơn')
], orderController.cancelOrder);

// Restaurant owner routes
router.get('/restaurant/:restaurantId', 
  restrictTo('restaurant', 'admin'),
  orderController.getRestaurantOrders
);

router.patch('/:id/status',
  restrictTo('restaurant', 'admin'),
  [
    body('status')
      .isIn(['preparing', 'ready', 'completed', 'cancelled'])
      .withMessage('Trạng thái đơn hàng không hợp lệ'),
    body('note')
      .optional()
      .isString()
      .withMessage('Ghi chú không hợp lệ')
  ],
  orderController.updateOrderStatus
);

router.patch('/:id/assign-driver',
  restrictTo('restaurant', 'admin'),
  [
    body('driverId')
      .isInt()
      .withMessage('ID tài xế không hợp lệ')
  ],
  orderController.assignDriver
);

module.exports = router;