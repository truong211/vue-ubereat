const { User, Product } = require('../models');
const { AppError } = require('../middleware/error.middleware');

/**
 * Get all favorite dishes for the logged-in user
 * @route GET /api/favorites/dishes
 * @access Private
 */
exports.getFavoriteDishes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Get favorite dish IDs from user
    const favoriteDishIds = user.favoriteDishes || [];
    
    // If no favorites, return empty array
    if (favoriteDishIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          favorites: []
        }
      });
    }
    
    // Get dish details
    const favorites = await Product.findAll({
      where: {
        id: favoriteDishIds
      },
      include: [
        {
          association: 'restaurant',
          attributes: ['id', 'name', 'image_url']
        },
        {
          association: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      results: favorites.length,
      data: {
        favorites
      }
    });
  } catch (error) {
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
    const dish = await Product.findByPk(dishId);
    if (!dish) {
      return next(new AppError('Dish not found', 404));
    }
    
    // Get user
    const user = await User.findByPk(userId);
    
    // Add dish to favorites if not already there
    const favorites = user.favoriteDishes || [];
    if (!favorites.includes(dishId)) {
      favorites.push(dishId);
      user.favoriteDishes = favorites;
      await user.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Dish added to favorites',
        dish: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          image_url: dish.image_url
        }
      }
    });
  } catch (error) {
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
    const dishId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get user
    const user = await User.findByPk(userId);
    
    // Remove dish from favorites
    const favorites = user.favoriteDishes || [];
    user.favoriteDishes = favorites.filter(id => parseInt(id) !== dishId);
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Dish removed from favorites'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a dish is in favorites
 * @route GET /api/favorites/dishes/:id/check
 * @access Private
 */
exports.checkFavoriteDish = async (req, res, next) => {
  try {
    const dishId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get user
    const user = await User.findByPk(userId);
    
    // Check if dish is in favorites
    const favorites = user.favoriteDishes || [];
    const isFavorite = favorites.includes(dishId) || favorites.some(id => parseInt(id) === dishId);
    
    res.status(200).json({
      status: 'success',
      data: {
        isFavorite
      }
    });
  } catch (error) {
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
    const dishId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if dish exists
    const dish = await Product.findByPk(dishId);
    if (!dish) {
      return next(new AppError('Dish not found', 404));
    }
    
    // Get user
    const user = await User.findByPk(userId);
    
    // Toggle dish in favorites
    const favorites = user.favoriteDishes || [];
    const index = favorites.findIndex(id => parseInt(id) === dishId);
    
    let added = false;
    if (index === -1) {
      // Add to favorites
      favorites.push(dishId);
      added = true;
    } else {
      // Remove from favorites
      favorites.splice(index, 1);
    }
    
    user.favoriteDishes = favorites;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        message: added ? 'Dish added to favorites' : 'Dish removed from favorites',
        isFavorite: added,
        dish: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          image_url: dish.image_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 