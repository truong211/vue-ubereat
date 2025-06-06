const { Category, Restaurant, Product } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    
    const filter = {};
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    const categories = await Category.findAll({
      where: filter,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ],
      order: [['displayOrder', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'products',
          where: { status: 'available' },
          required: false
        }
      ]
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create category
 * @route POST /api/categories
 * @access Private (Restaurant Owner)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, displayOrder, restaurantId } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to create categories for this restaurant', 403));
    }

    // Handle image upload
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    const category = await Category.create({
      name,
      description,
      displayOrder: displayOrder || 0,
      restaurantId,
      image,
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PATCH /api/categories/:id
 * @access Private (Restaurant Owner)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, displayOrder, isActive } = req.body;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    if (category.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this category', 403));
    }

    // Update image if provided
    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    category.displayOrder = displayOrder !== undefined ? displayOrder : category.displayOrder;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    await category.save();

    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Private (Restaurant Owner)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    if (category.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this category', 403));
    }

    await category.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};