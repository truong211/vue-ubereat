'use strict';

const express = require('express');
const router = express.Router();
const reviewResponseController = require('../controllers/review-response.controller');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

// Create a response to a review - Admin/Owner/Staff only
router.post('/', 
  auth, 
  checkRole(['admin', 'owner', 'staff']), 
  reviewResponseController.createResponse
);

// Update a response - Admin/Owner/Staff only
router.put('/:id', 
  auth, 
  checkRole(['admin', 'owner', 'staff']), 
  reviewResponseController.updateResponse
);

// Delete a response - Admin/Owner only
router.delete('/:id', 
  auth, 
  checkRole(['admin', 'owner']), 
  reviewResponseController.deleteResponse
);

// Get response by review ID
router.get('/review/:reviewId', 
  reviewResponseController.getResponseByReviewId
);

// Get all responses for a restaurant
router.get('/restaurant/:restaurantId', 
  reviewResponseController.getResponsesByRestaurant
);

// Get review response analytics - Admin/Owner only
router.get('/analytics', 
  auth, 
  checkRole(['admin', 'owner']), 
  reviewResponseController.getResponseAnalytics
);

module.exports = router; 