const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const favoritesController = require('../controllers/favorites.controller');

// Get user's favorite foods
router.get('/foods', 
    authMiddleware,
    favoritesController.getFavoriteFoods
);

// Add a food to favorites
router.post('/foods/:foodId', 
    authMiddleware,
    favoritesController.addFavoriteFood
);

// Remove a food from favorites
router.delete('/foods/:foodId', 
    authMiddleware,
    favoritesController.removeFavoriteFood
);

module.exports = router;