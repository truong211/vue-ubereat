const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Process payment
router.post(
  '/process',
  [
    protect,
    check('orderId', 'Order ID is required').not().isEmpty(),
    check('paymentMethodId', 'Payment method ID is required').not().isEmpty()
  ],
  paymentController.processPayment
);

// Get payment status
router.get(
  '/:orderId',
  protect,
  paymentController.getPaymentStatus
);

// Create payment intent (for mobile apps)
router.post(
  '/create-intent',
  [
    protect,
    check('orderId', 'Order ID is required').not().isEmpty()
  ],
  paymentController.createPaymentIntent
);

// Handle Stripe webhook
router.post(
  '/webhook',
  paymentController.handleWebhook
);

// Process cash payment
router.post(
  '/cash',
  [
    protect,
    check('orderId', 'Order ID is required').not().isEmpty()
  ],
  paymentController.processCashPayment
);

// Confirm cash payment (for delivery personnel)
router.post(
  '/cash/confirm',
  [
    protect,
    check('orderId', 'Order ID is required').not().isEmpty(),
    check('amountCollected', 'Amount collected is required').isNumeric()
  ],
  paymentController.confirmCashPayment
);

// Refund payment (admin only)
router.post(
  '/refund',
  [
    protect,
    check('orderId', 'Order ID is required').not().isEmpty()
  ],
  paymentController.refundPayment
);

// Get payment history
router.get(
  '/history',
  protect,
  paymentController.getPaymentHistory
);

module.exports = router;