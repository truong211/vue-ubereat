const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Import favorites controller (will create next)
const favoritesController = require('../controllers/favorites.controller');

// Get user's favorite foods
router.get('/foods', authenticate, favoritesController.getFavoriteFoods);

// Add a food to favorites
router.post('/foods/:foodId', authenticate, favoritesController.addFavoriteFood);

// Remove a food from favorites
router.delete('/foods/:foodId', authenticate, favoritesController.removeFavoriteFood);

module.exports = router;