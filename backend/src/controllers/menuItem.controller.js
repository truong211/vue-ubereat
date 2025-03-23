const { MenuItem, Restaurant, Category } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

exports.getAllMenuItems = async (req, res, next) => {
  try {
    const { restaurantId, categoryId } = req.query;
    
    const filter = {};
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    const items = await MenuItem.findAll({
      where: filter,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      data: {
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      description, 
      price, 
      categoryId, 
      available = true,
      sizes = [],
      toppings = []
    } = req.body;

    // Check if category exists and user is authorized
    const category = await Category.findByPk(categoryId, {
      include: [{ model: Restaurant, as: 'restaurant' }]
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Verify restaurant ownership
    if (category.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to add items to this restaurant', 403));
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      categoryId,
      restaurantId: category.restaurant.id,
      available,
      sizes: JSON.stringify(sizes),
      toppings: JSON.stringify(toppings),
      image: req.file ? req.file.filename : null
    });

    res.status(201).json({
      status: 'success',
      data: {
        item: menuItem
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      available,
      sizes,
      toppings
    } = req.body;

    const menuItem = await MenuItem.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          include: [{ model: Restaurant, as: 'restaurant' }]
        }
      ]
    });

    if (!menuItem) {
      return next(new AppError('Menu item not found', 404));
    }

    // Verify restaurant ownership
    if (menuItem.category.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this item', 403));
    }

    // If changing category, verify new category belongs to same restaurant
    if (categoryId && categoryId !== menuItem.categoryId) {
      const newCategory = await Category.findByPk(categoryId, {
        include: [{ model: Restaurant, as: 'restaurant' }]
      });

      if (!newCategory || newCategory.restaurant.id !== menuItem.category.restaurant.id) {
        return next(new AppError('Invalid category', 400));
      }
    }

    // Update menu item
    menuItem.name = name || menuItem.name;
    menuItem.description = description !== undefined ? description : menuItem.description;
    menuItem.price = price !== undefined ? price : menuItem.price;
    menuItem.categoryId = categoryId || menuItem.categoryId;
    menuItem.available = available !== undefined ? available : menuItem.available;
    menuItem.sizes = sizes ? JSON.stringify(sizes) : menuItem.sizes;
    menuItem.toppings = toppings ? JSON.stringify(toppings) : menuItem.toppings;

    if (req.file) {
      menuItem.image = req.file.filename;
    }

    await menuItem.save();

    res.status(200).json({
      status: 'success',
      data: {
        item: menuItem
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          include: [{ model: Restaurant, as: 'restaurant' }]
        }
      ]
    });

    if (!menuItem) {
      return next(new AppError('Menu item not found', 404));
    }

    // Verify restaurant ownership
    if (menuItem.category.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this item', 403));
    }

    await menuItem.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { available } = req.body;

    const menuItem = await MenuItem.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          include: [{ model: Restaurant, as: 'restaurant' }]
        }
      ]
    });

    if (!menuItem) {
      return next(new AppError('Menu item not found', 404));
    }

    // Verify restaurant ownership
    if (menuItem.category.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this item', 403));
    }

    menuItem.available = available;
    await menuItem.save();

    res.status(200).json({
      status: 'success',
      data: {
        item: menuItem
      }
    });
  } catch (error) {
    next(error);
  }
};