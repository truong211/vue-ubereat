const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const cartController = require('../controllers/cart.controller');
const { check } = require('express-validator');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/', [
  check('productId').isInt().withMessage('Product ID must be an integer'),
  check('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], cartController.addToCart);

// Update cart item
router.patch('/:id', [
  check('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], cartController.updateCartItem);

// Remove item from cart
router.delete('/:id', cartController.removeFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

// Set special instructions for the order
router.post('/instructions', cartController.setSpecialInstructions);

// Set delivery address for the order
router.post('/address', [
  check('addressId').isInt().withMessage('Address ID must be an integer')
], cartController.setDeliveryAddress);

// Schedule delivery
router.post('/schedule', [
  check('type').optional().isIn(['asap', 'scheduled']).withMessage('type must be asap or scheduled'),
  check('scheduledTime').optional().isISO8601().withMessage('Invalid date format')
], cartController.scheduleDelivery);

// Cancel scheduled delivery
router.delete('/schedule', cartController.cancelScheduledDelivery);

// Apply promotion code
router.post('/promotion', [
  check('code').isString().withMessage('Promotion code is required')
], cartController.applyPromotion);

// Remove promotion code
router.delete('/promotion', cartController.removePromotion);

module.exports = router;