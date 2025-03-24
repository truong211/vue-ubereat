const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyalty.controller');
// const auth = require('../middleware/auth');

// User loyalty routes
// Get a user's loyalty status
// GET /api/loyalty/user/:userId
router.get('/user/:userId', loyaltyController.getUserLoyalty);

// Get a user's loyalty status for a specific restaurant
// GET /api/loyalty/user/:userId/restaurant/:restaurantId
router.get('/user/:userId/restaurant/:restaurantId', loyaltyController.getUserLoyalty);

// Create or update a user's loyalty
// POST /api/loyalty/user
router.post('/user', loyaltyController.updateUserLoyalty);

// Loyalty rewards routes
// Create loyalty reward
// POST /api/loyalty/rewards
router.post('/rewards', loyaltyController.createReward);

// Get all rewards
// GET /api/loyalty/rewards
router.get('/rewards', loyaltyController.getAllRewards);

// Get reward by ID
// GET /api/loyalty/rewards/:id
router.get('/rewards/:id', loyaltyController.getRewardById);

// Update reward
// PUT /api/loyalty/rewards/:id
router.put('/rewards/:id', loyaltyController.updateReward);

// Delete reward
// DELETE /api/loyalty/rewards/:id
router.delete('/rewards/:id', loyaltyController.deleteReward);

// Redeem a reward
// POST /api/loyalty/redeem
router.post('/redeem', loyaltyController.redeemReward);

module.exports = router; 