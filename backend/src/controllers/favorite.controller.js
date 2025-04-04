const db = require('../config/database');
const { AppError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

/**
 * Get all favorite dishes for the logged-in user
 * @route GET /api/favorites/dishes
 * @access Private
 */
exports.getFavoriteDishes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's favorite dishes from the database
    const favorites = await db.query(`
      SELECT 
        p.*,
        r.name as restaurantName,
        r.logo as restaurantImage,
        c.name as categoryName
      FROM 
        products p
      JOIN 
        user_favorites uf ON p.id = uf.itemId
      LEFT JOIN 
        restaurants r ON p.restaurantId = r.id
      LEFT JOIN 
        categories c ON p.categoryId = c.id
      WHERE 
        uf.userId = ? AND uf.type = 'dish'
      ORDER BY 
        uf.createdAt DESC
    `, [userId]);
    
    res.status(200).json({
      status: 'success',
      results: favorites.length,
      data: { favorites }
    });
  } catch (error) {
    logger.error('Error in getFavoriteDishes:', error);
    next(error);
  }
};

/**
 * Add a dish to favorites
 * @route POST /api/favorites/dishes
 * @access Private
 */
exports.addFavoriteDish = async (req, res, next) => {
  try {
    const { dishId } = req.body;
    const userId = req.user.id;
    
    if (!dishId) {
      return next(new AppError('Dish ID is required', 400));
    }
    
    // Check if dish exists
    const [dish] = await db.query('SELECT * FROM products WHERE id = ?', [dishId]);
    
    if (!dish) {
      return next(new AppError('Dish not found', 404));
    }
    
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "dish"',
      [userId, dishId]
    );
    
    if (existing) {
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'Dish already in favorites',
          dish
        }
      });
    }
    
    // Add to favorites
    await db.query(
      'INSERT INTO user_favorites (userId, itemId, type, createdAt) VALUES (?, ?, ?, NOW())',
      [userId, dishId, 'dish']
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        message: 'Dish added to favorites',
        dish
      }
    });
  } catch (error) {
    logger.error('Error in addFavoriteDish:', error);
    next(error);
  }
};

/**
 * Remove a dish from favorites
 * @route DELETE /api/favorites/dishes/:id
 * @access Private
 */
exports.removeFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.params.id;
    const userId = req.user.id;
    
    // Remove from favorites
    const result = await db.query(
      'DELETE FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "dish"',
      [userId, dishId]
    );
    
    if (result.affectedRows === 0) {
      return next(new AppError('Dish not found in favorites', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Dish removed from favorites'
      }
    });
  } catch (error) {
    logger.error('Error in removeFavoriteDish:', error);
    next(error);
  }
};

/**
 * Check if a dish is in favorites
 * @route GET /api/favorites/dishes/:id/check
 * @access Public (returns isFavorite: false if not logged in)
 */
exports.checkFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.params.id;
    
    // If no authenticated user, return not favorite
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: {
          isFavorite: false
        }
      });
    }
    
    const userId = req.user.id;
    
    // Check if in favorites
    const [favorite] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "dish"',
      [userId, dishId]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    logger.error('Error in checkFavoriteDish:', error);
    next(error);
  }
};

/**
 * Toggle a dish in favorites (add if not present, remove if present)
 * @route POST /api/favorites/dishes/:id/toggle
 * @access Private
 */
exports.toggleFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.params.id;
    const userId = req.user.id;
    
    // Check if dish exists
    const [dish] = await db.query('SELECT * FROM products WHERE id = ?', [dishId]);
    
    if (!dish) {
      return next(new AppError('Dish not found', 404));
    }
    
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "dish"',
      [userId, dishId]
    );
    
    let added = false;
    let message = '';
    
    if (!existing) {
      // Add to favorites
      await db.query(
        'INSERT INTO user_favorites (userId, itemId, type, createdAt) VALUES (?, ?, ?, NOW())',
        [userId, dishId, 'dish']
      );
      added = true;
      message = 'Dish added to favorites';
    } else {
      // Remove from favorites
      await db.query(
        'DELETE FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "dish"',
        [userId, dishId]
      );
      message = 'Dish removed from favorites';
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message,
        added,
        dish
      }
    });
  } catch (error) {
    logger.error('Error in toggleFavoriteDish:', error);
    next(error);
  }
};

/**
 * Get all favorite foods for the logged-in user
 * @route GET /api/favorites/foods
 * @access Private
 */
exports.getFavoriteFoods = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's favorite foods from the database
    const favorites = await db.query(`
      SELECT 
        p.*,
        r.name as restaurantName,
        r.logo as restaurantImage,
        c.name as categoryName
      FROM 
        products p
      JOIN 
        user_favorites uf ON p.id = uf.itemId
      LEFT JOIN 
        restaurants r ON p.restaurantId = r.id
      LEFT JOIN 
        categories c ON p.categoryId = c.id
      WHERE 
        uf.userId = ? AND uf.type = 'food'
      ORDER BY 
        uf.createdAt DESC
    `, [userId]);
    
    res.status(200).json({
      status: 'success',
      results: favorites.length,
      data: { favorites }
    });
  } catch (error) {
    logger.error('Error in getFavoriteFoods:', error);
    next(error);
  }
};

/**
 * Add a food to favorites
 * @route POST /api/favorites/foods
 * @access Private
 */
exports.addFavoriteFood = async (req, res, next) => {
  try {
    const { foodId } = req.body;
    const userId = req.user.id;
    
    if (!foodId) {
      return next(new AppError('Food ID is required', 400));
    }
    
    // Check if food exists
    const [food] = await db.query('SELECT * FROM products WHERE id = ?', [foodId]);
    
    if (!food) {
      return next(new AppError('Food not found', 404));
    }
    
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "food"',
      [userId, foodId]
    );
    
    if (existing) {
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'Food already in favorites',
          food
        }
      });
    }
    
    // Add to favorites
    await db.query(
      'INSERT INTO user_favorites (userId, itemId, type, createdAt) VALUES (?, ?, ?, NOW())',
      [userId, foodId, 'food']
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        message: 'Food added to favorites',
        food
      }
    });
  } catch (error) {
    logger.error('Error in addFavoriteFood:', error);
    next(error);
  }
};

/**
 * Remove a food from favorites
 * @route DELETE /api/favorites/foods/:id
 * @access Private
 */
exports.removeFavoriteFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const userId = req.user.id;
    
    // Remove from favorites
    const result = await db.query(
      'DELETE FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "food"',
      [userId, foodId]
    );
    
    if (result.affectedRows === 0) {
      return next(new AppError('Food not found in favorites', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Food removed from favorites'
      }
    });
  } catch (error) {
    logger.error('Error in removeFavoriteFood:', error);
    next(error);
  }
};

/**
 * Check if a food is in favorites
 * @route GET /api/favorites/foods/:id/check
 * @access Public (returns isFavorite: false if not logged in)
 */
exports.checkFavoriteFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    
    // If no authenticated user, return not favorite
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: {
          isFavorite: false
        }
      });
    }
    
    const userId = req.user.id;
    
    // Check if in favorites
    const [favorite] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "food"',
      [userId, foodId]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    logger.error('Error in checkFavoriteFood:', error);
    next(error);
  }
};

/**
 * Toggle a food in favorites (add if not present, remove if present)
 * @route POST /api/favorites/foods/:id/toggle
 * @access Private
 */
exports.toggleFavoriteFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const userId = req.user.id;
    
    // Check if food exists
    const [food] = await db.query('SELECT * FROM products WHERE id = ?', [foodId]);
    
    if (!food) {
      return next(new AppError('Food not found', 404));
    }
    
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "food"',
      [userId, foodId]
    );
    
    let added = false;
    let message = '';
    
    if (!existing) {
      // Add to favorites
      await db.query(
        'INSERT INTO user_favorites (userId, itemId, type, createdAt) VALUES (?, ?, ?, NOW())',
        [userId, foodId, 'food']
      );
      added = true;
      message = 'Food added to favorites';
    } else {
      // Remove from favorites
      await db.query(
        'DELETE FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "food"',
        [userId, foodId]
      );
      message = 'Food removed from favorites';
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message,
        added,
        food
      }
    });
  } catch (error) {
    logger.error('Error in toggleFavoriteFood:', error);
    next(error);
  }
};

/**
 * Get all favorite restaurants for the logged-in user
 * @route GET /api/favorites/restaurants
 * @access Private
 */
exports.getFavoriteRestaurants = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's favorite restaurants from the database
    const favorites = await db.query(`
      SELECT 
        r.*
      FROM 
        restaurants r
      JOIN 
        user_favorites uf ON r.id = uf.itemId
      WHERE 
        uf.userId = ? AND uf.type = 'restaurant'
      ORDER BY 
        uf.createdAt DESC
    `, [userId]);
    
    res.status(200).json({
      status: 'success',
      results: favorites.length,
      data: { favorites }
    });
  } catch (error) {
    logger.error('Error in getFavoriteRestaurants:', error);
    next(error);
  }
};

/**
 * Add a restaurant to favorites
 * @route POST /api/favorites/restaurants
 * @access Private
 */
exports.addFavoriteRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;
    const userId = req.user.id;
    
    if (!restaurantId) {
      return next(new AppError('Restaurant ID is required', 400));
    }
    
    // Check if restaurant exists
    const [restaurant] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
    
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }
    
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "restaurant"',
      [userId, restaurantId]
    );
    
    if (existing) {
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'Restaurant already in favorites',
          restaurant
        }
      });
    }
    
    // Add to favorites
    await db.query(
      'INSERT INTO user_favorites (userId, itemId, type, createdAt) VALUES (?, ?, ?, NOW())',
      [userId, restaurantId, 'restaurant']
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        message: 'Restaurant added to favorites',
        restaurant
      }
    });
  } catch (error) {
    logger.error('Error in addFavoriteRestaurant:', error);
    next(error);
  }
};

/**
 * Remove a restaurant from favorites
 * @route DELETE /api/favorites/restaurants/:id
 * @access Private
 */
exports.removeFavoriteRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const userId = req.user.id;
    
    // Remove from favorites
    const result = await db.query(
      'DELETE FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "restaurant"',
      [userId, restaurantId]
    );
    
    if (result.affectedRows === 0) {
      return next(new AppError('Restaurant not found in favorites', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Restaurant removed from favorites'
      }
    });
  } catch (error) {
    logger.error('Error in removeFavoriteRestaurant:', error);
    next(error);
  }
};

/**
 * Check if a restaurant is in favorites
 * @route GET /api/favorites/restaurants/:id/check
 * @access Public (returns isFavorite: false if not logged in)
 */
exports.checkFavoriteRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    
    // If no authenticated user, return not favorite
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: {
          isFavorite: false
        }
      });
    }
    
    const userId = req.user.id;
    
    // Check if in favorites
    const [favorite] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "restaurant"',
      [userId, restaurantId]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    logger.error('Error in checkFavoriteRestaurant:', error);
    next(error);
  }
};

/**
 * Toggle a restaurant in favorites (add if not present, remove if present)
 * @route POST /api/favorites/restaurants/:id/toggle
 * @access Private
 */
exports.toggleFavoriteRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const userId = req.user.id;
    
    // Check if restaurant exists
    const [restaurant] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
    
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }
    
    // Check if already favorited
    const [existing] = await db.query(
      'SELECT * FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "restaurant"',
      [userId, restaurantId]
    );
    
    let added = false;
    let message = '';
    
    if (!existing) {
      // Add to favorites
      await db.query(
        'INSERT INTO user_favorites (userId, itemId, type, createdAt) VALUES (?, ?, ?, NOW())',
        [userId, restaurantId, 'restaurant']
      );
      added = true;
      message = 'Restaurant added to favorites';
    } else {
      // Remove from favorites
      await db.query(
        'DELETE FROM user_favorites WHERE userId = ? AND itemId = ? AND type = "restaurant"',
        [userId, restaurantId]
      );
      message = 'Restaurant removed from favorites';
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message,
        added,
        restaurant
      }
    });
  } catch (error) {
    logger.error('Error in toggleFavoriteRestaurant:', error);
    next(error);
  }
}; 