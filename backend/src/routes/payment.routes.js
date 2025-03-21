const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

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

// Receipt generation endpoints
router.get('/:id/receipt', authMiddleware, PaymentController.generatePaymentReceipt);
router.get('/:id/receipt/download', authMiddleware, PaymentController.downloadPaymentReceipt);

// Public payment verification (for QR code verification)
router.get('/verify/:id', PaymentController.verifyPaymentPublic);

// Admin payment reconciliation routes
router.post('/:id/reconcile', authMiddleware, adminMiddleware, PaymentController.reconcilePayment);
router.post('/reconcile-all', authMiddleware, adminMiddleware, PaymentController.reconcileAllPayments);
router.get('/reconciliation-report', authMiddleware, adminMiddleware, PaymentController.getReconciliationReport);

module.exports = router;