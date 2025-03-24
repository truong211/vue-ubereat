const express = require('express');
const router = express.Router();
const reviewResponseController = require('../controllers/reviewResponse.controller');
// const auth = require('../middleware/auth');

// Create a response to a review
// POST /api/review-responses
router.post('/', reviewResponseController.createResponse);

// Get responses by restaurant
// GET /api/review-responses/restaurant/:restaurantId
router.get('/restaurant/:restaurantId', reviewResponseController.getResponsesByRestaurant);

// Get response by ID
// GET /api/review-responses/:id
router.get('/:id', reviewResponseController.getResponseById);

// Update response
// PUT /api/review-responses/:id
router.put('/:id', reviewResponseController.updateResponse);

// Delete response
// DELETE /api/review-responses/:id
router.delete('/:id', reviewResponseController.deleteResponse);

// Get pending reviews (reviews without responses) for a restaurant
// GET /api/review-responses/pending/restaurant/:restaurantId
router.get('/pending/restaurant/:restaurantId', reviewResponseController.getPendingReviews);

module.exports = router; 