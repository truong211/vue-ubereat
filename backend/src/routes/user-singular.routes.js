const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// Apply auth middleware to all routes
router.use(protect);

/**
 * @route GET /api/user/addresses
 * @desc Get user addresses - redirects to the plural route
 * @access Private
 */
router.get('/addresses', userController.getAddresses);

/**
 * @route GET /api/user/payment-methods
 * @desc Get user payment methods
 * @access Private
 */
router.get('/payment-methods', (req, res) => {
  // Return empty array for now as this is a placeholder
  res.status(200).json({
    status: 'success',
    data: {
      paymentMethods: []
    }
  });
});

/**
 * @route POST /api/user/payment-methods
 * @desc Add new payment method
 * @access Private
 */
router.post('/payment-methods', (req, res) => {
  // Return success for now as this is a placeholder
  res.status(201).json({
    status: 'success',
    data: {
      paymentMethod: {
        id: Date.now(),
        userId: req.user.id,
        type: req.body.type || 'credit_card',
        cardNumber: req.body.cardNumber ? `xxxx-xxxx-xxxx-${req.body.cardNumber.slice(-4)}` : 'xxxx-xxxx-xxxx-1234',
        expiryDate: req.body.expiryDate || '12/25',
        isDefault: req.body.isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  });
});

/**
 * @route DELETE /api/user/payment-methods/:id
 * @desc Delete payment method
 * @access Private
 */
router.delete('/payment-methods/:id', (req, res) => {
  // Return success for now as this is a placeholder
  res.status(204).send();
});

module.exports = router; 