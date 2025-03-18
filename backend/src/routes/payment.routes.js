const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Payment processing routes
router.post('/process/card', authMiddleware, PaymentController.processCardPayment);
router.post('/process/momo', authMiddleware, PaymentController.processMomoPayment);
router.post('/process/vnpay', authMiddleware, PaymentController.processVNPayPayment);
router.post('/process/zalopay', authMiddleware, PaymentController.processZaloPayPayment);

// Payment callbacks/webhooks
router.post('/callback/momo', PaymentController.verifyMomoPayment);
router.get('/callback/vnpay', PaymentController.verifyVNPayPayment);
router.post('/callback/zalopay', PaymentController.verifyZaloPayPayment);
router.post('/webhook/stripe', PaymentController.verifyCardPayment);

// Saved cards management
router.get('/cards', authMiddleware, PaymentController.getSavedCards);
router.delete('/cards/:cardId', authMiddleware, PaymentController.deleteSavedCard);

// Generic payment verification endpoint
router.post('/verify/:provider/:transaction_ref', PaymentController.verifyPayment);

module.exports = router;