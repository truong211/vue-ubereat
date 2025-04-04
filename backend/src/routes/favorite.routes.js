const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { optionalToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// Remove global authentication - will add to individual routes
// router.use(protect);

/**
 * @route GET /api/favorites/foods
 * @desc Get all favorite foods for the logged-in user
 * @access Private
 */
router.get('/foods', favoriteController.getFavoriteFoods);

/**
 * @route POST /api/favorites/foods
 * @desc Add a food to favorites
 * @access Private
 */
router.post(
  '/foods',
  [
    body('foodId')
      .notEmpty()
      .withMessage('Food ID is required')
      .isInt()
      .withMessage('Food ID must be an integer')
  ],
  favoriteController.addFavoriteFood
);

/**
 * @route DELETE /api/favorites/foods/:id
 * @desc Remove a food from favorites
 * @access Private
 */
router.delete('/foods/:id', favoriteController.removeFavoriteFood);

/**
 * @route GET /api/favorites/foods/:id/check
 * @desc Check if a food is in favorites
 * @access Private
 */
router.get('/foods/:id/check', optionalToken, favoriteController.checkFavoriteFood);

/**
 * @route POST /api/favorites/foods/:id/toggle
 * @desc Toggle a food in favorites (add if not present, remove if present)
 * @access Private
 */
router.post('/foods/:id/toggle', favoriteController.toggleFavoriteFood);

/**
 * @route GET /api/favorites/restaurants
 * @desc Get all favorite restaurants for the logged-in user
 * @access Private
 */
router.get('/restaurants', favoriteController.getFavoriteRestaurants);

/**
 * @route POST /api/favorites/restaurants
 * @desc Add a restaurant to favorites
 * @access Private
 */
router.post(
  '/restaurants',
  [
    body('restaurantId')
      .notEmpty()
      .withMessage('Restaurant ID is required')
      .isInt()
      .withMessage('Restaurant ID must be an integer')
  ],
  favoriteController.addFavoriteRestaurant
);

/**
 * @route DELETE /api/favorites/restaurants/:id
 * @desc Remove a restaurant from favorites
 * @access Private
 */
router.delete('/restaurants/:id', favoriteController.removeFavoriteRestaurant);

/**
 * @route GET /api/favorites/restaurants/:id/check
 * @desc Check if a restaurant is in favorites
 * @access Private
 */
router.get('/restaurants/:id/check', optionalToken, favoriteController.checkFavoriteRestaurant);

/**
 * @route POST /api/favorites/restaurants/:id/toggle
 * @desc Toggle a restaurant in favorites (add if not present, remove if present)
 * @access Private
 */
router.post('/restaurants/:id/toggle', favoriteController.toggleFavoriteRestaurant);

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
router.get('/dishes/:id/check', optionalToken, favoriteController.checkFavoriteDish);

/**
 * @route POST /api/favorites/dishes/:id/toggle
 * @desc Toggle a dish in favorites (add if not present, remove if present)
 * @access Private
 */
router.post('/dishes/:id/toggle', favoriteController.toggleFavoriteDish);

module.exports = router;