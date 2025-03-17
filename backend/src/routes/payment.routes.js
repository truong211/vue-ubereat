const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { body } = require('express-validator');

// Payment method validation rules
const paymentMethodRules = [
  body('order_id').notEmpty().withMessage('Order ID is required'),
  body('return_url').notEmpty().withMessage('Return URL is required')
];

// Card payment validation rules
const cardPaymentRules = [
  body('order_id').notEmpty().withMessage('Order ID is required'),
  body('card_number').notEmpty().matches(/^\d{16}$/).withMessage('Valid card number is required'),
  body('expiry').notEmpty().matches(/^\d{2}\/\d{2}$/).withMessage('Valid expiry date is required'),
  body('cvv').notEmpty().matches(/^\d{3,4}$/).withMessage('Valid CVV is required')
];

// Get saved cards
router.get('/saved-cards', auth, PaymentController.getSavedCards);

// Delete saved card
router.delete('/saved-cards/:cardId', auth, PaymentController.deleteSavedCard);

// Process card payment
router.post('/process',
  auth,
  cardPaymentRules,
  validate,
  PaymentController.processCardPayment
);

// Process VNPay payment
router.post('/vnpay/init',
  auth,
  paymentMethodRules,
  validate,
  PaymentController.processVNPayPayment
);

// VNPay payment callback
router.get('/vnpay/callback', PaymentController.verifyVNPayPayment);

// Process Momo payment
router.post('/momo/init',
  auth,
  paymentMethodRules,
  validate,
  PaymentController.processMomoPayment
);

// Momo payment callback
router.post('/momo/callback', PaymentController.verifyMomoPayment);

// Process ZaloPay payment
router.post('/zalopay/init',
  auth,
  paymentMethodRules,
  validate,
  PaymentController.processZaloPayment
);

// ZaloPay payment callback
router.post('/zalopay/callback', PaymentController.verifyZaloPayPayment);

module.exports = router;