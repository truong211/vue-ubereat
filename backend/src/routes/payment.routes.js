const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Log all available controller methods
console.log('Payment controller methods:', Object.keys(PaymentController));

// Main payment processing route that handles all methods
router.post('/process', authMiddleware, PaymentController.processPayment);

// Generic payment verification endpoint
router.post('/verify/:provider/:transactionRef', PaymentController.verifyPayment);

// Receipt generation endpoints
router.get('/:id/receipt', authMiddleware, PaymentController.generateReceipt);
router.get('/:id/receipt/download', authMiddleware, PaymentController.downloadReceipt);

// Admin payment reconciliation routes
router.post('/reconcile', authMiddleware, PaymentController.reconcilePayments);

module.exports = router;