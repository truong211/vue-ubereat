const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
// const auth = require('../middleware/auth');

// Create a new promotion/voucher
// POST /api/promotions
router.post('/', promotionController.createPromotion);

// Get all promotions (with filters)
// GET /api/promotions
router.get('/', promotionController.getAllPromotions);

// Get promotion by ID
// GET /api/promotions/:id
router.get('/:id', promotionController.getPromotionById);

// Update promotion
// PUT /api/promotions/:id
router.put('/:id', promotionController.updatePromotion);

// Delete promotion
// DELETE /api/promotions/:id
router.delete('/:id', promotionController.deletePromotion);

// Validate a promotion code
// POST /api/promotions/validate
router.post('/validate', promotionController.validatePromotion);

// Apply a promotion to an order
// POST /api/promotions/apply
router.post('/apply', promotionController.applyPromotion);

module.exports = router; 