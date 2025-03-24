const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/favorites/dishes
 * @desc Get all favorite dishes for the logged-in user
 * @access Private
 */
router.get('/dishes', favoriteController.getFavoriteDishes);

/**
 * @route POST /api/favorites/dishes
 * @desc Add a dish to favorites
 * @access Private
 */
router.post(
  '/dishes',
  [
    body('dishId')
      .notEmpty()
      .withMessage('Dish ID is required')
      .isInt()
      .withMessage('Dish ID must be an integer')
  ],
  favoriteController.addFavoriteDish
);

/**
 * @route DELETE /api/favorites/dishes/:id
 * @desc Remove a dish from favorites
 * @access Private
 */
router.delete('/dishes/:id', favoriteController.removeFavoriteDish);

/**
 * @route GET /api/favorites/dishes/:id/check
 * @desc Check if a dish is in favorites
 * @access Private
 */
router.get('/dishes/:id/check', favoriteController.checkFavoriteDish);

/**
 * @route POST /api/favorites/dishes/:id/toggle
 * @desc Toggle a dish in favorites (add if not present, remove if present)
 * @access Private
 */
router.post('/dishes/:id/toggle', favoriteController.toggleFavoriteDish);

module.exports = router; 