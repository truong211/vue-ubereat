'use strict';

const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyalty.controller');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/role.middleware');

// Get user's loyalty account
router.get('/user/:userId', 
  auth, 
  loyaltyController.getUserLoyalty
);

// Add points to user's loyalty account - Admin/Owner/Staff only
router.post('/user/:userId/points', 
  auth, 
  checkRole(['admin', 'owner', 'staff']), 
  loyaltyController.addPoints
);

// Get available rewards for a user
router.get('/user/:userId/rewards', 
  auth, 
  loyaltyController.getAvailableRewards
);

// Redeem a reward
router.post('/user/:userId/redeem', 
  auth, 
  loyaltyController.redeemReward
);

// Get user's redemption history
router.get('/user/:userId/redemptions', 
  auth, 
  loyaltyController.getRedemptionHistory
);

// Create a new loyalty reward - Admin/Owner only
router.post('/rewards', 
  auth, 
  checkRole(['admin', 'owner']), 
  loyaltyController.createReward
);

// Update a loyalty reward - Admin/Owner only
router.put('/rewards/:id', 
  auth, 
  checkRole(['admin', 'owner']), 
  loyaltyController.updateReward
);

// Get loyalty program analytics - Admin/Owner only
router.get('/analytics', 
  auth, 
  checkRole(['admin', 'owner']), 
  loyaltyController.getLoyaltyAnalytics
);

module.exports = router;