const express = require('express');
const promotionCampaignController = require('../controllers/promotionCampaign.controller');

// Log the available controller methods
console.log('Promotion Campaign controller methods:', Object.keys(promotionCampaignController || {}));

const router = express.Router();

// Placeholder route to avoid empty router
router.get('/', (req, res) => {
  res.json({ message: 'Promotion Campaigns API is running' });
});

module.exports = router;