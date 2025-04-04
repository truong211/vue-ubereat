'use strict';

const express = require('express');
const { promotionErrorHandler } = require('../middleware/promotionError.middleware');
const promotionController = require('../controllers/promotion.controller');

// Let's log all available controller methods
console.log('Promotion controller methods:', Object.keys(promotionController));

const router = express.Router();

// Placeholder route to avoid empty router
router.get('/', (req, res) => {
  res.json({ message: 'Promotions API is running' });
});

// Apply error handling middleware
router.use(promotionErrorHandler);

module.exports = router;