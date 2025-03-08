const { validationResult } = require('express-validator');
const { Cart, Product, Restaurant } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

/**
 * Get user cart
 * @route GET /api/cart
 * @access Private
 */
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: Restaurant,
              as: 'restaurant',
              attributes: ['id', 'name', 'deliveryFee', 'minOrderAmount']
            }
          ]
        }
      ]
    });

    // Group cart items by restaurant
    const cartByRestaurant = cart.reduce((acc, item) => {
      const restaurantId = item.product.restaurantId;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          restaurant: item.product.restaurant,
          items: [],
          subtotal: 0
        };
      }
      
      const itemTotal = item.quantity * (item.product.discountPrice || item.product.price);
      acc[restaurantId].items.push(item);
      acc[restaurantId].subtotal += itemTotal;
      
      return acc;
    }, {});

    // Calculate total
    const total = Object.values(cartByRestaurant).reduce((sum, restaurant) => {
      return sum + restaurant.subtotal + (restaurant.subtotal > 0 ? restaurant.restaurant.deliveryFee : 0);
    }, 0);

    res.status(200).json({
      status: 'success',
      data: {
        cart: Object.values(cartByRestaurant),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * @route POST /api/cart
 * @access Private
 */
exports.addToCart = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity, options, notes } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.status !== 'available') {
      return next(new AppError('Product is not available', 400));
    }

    // Check if restaurant is active
    if (!product.restaurant.isActive) {
      return next(new AppError('Restaurant is not active', 400));
    }

    // Check if user already has items from another restaurant
    const existingCart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          where: {
            restaurantId: { [Op.ne]: product.restaurantId }
          }
        }
      ]
    });

    if (existingCart) {
      return next(new AppError('You already have items from another restaurant in your cart. Please clear your cart first.', 400));
    }

    // Check if item already exists in cart
    let cartItem = await Cart.findOne({
      where: {
        userId: req.user.id,
        productId
      }
    });

    if (cartItem) {
      // Update quantity
      cartItem.quantity += quantity;
      cartItem.options = options ? JSON.parse(options) : cartItem.options;
      cartItem.notes = notes || cartItem.notes;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId: req.user.id,
        productId,
        quantity,
        options: options ? JSON.parse(options) : null,
        notes
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        cartItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item
 * @route PATCH /api/cart/:id
 * @access Private
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, options, notes } = req.body;

    // Find cart item
    const cartItem = await Cart.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!cartItem) {
      return next(new AppError('Cart item not found', 404));
    }

    // Update cart item
    cartItem.quantity = quantity || cartItem.quantity;
    cartItem.options = options ? JSON.parse(options) : cartItem.options;
    cartItem.notes = notes !== undefined ? notes : cartItem.notes;

    await cartItem.save();

    res.status(200).json({
      status: 'success',
      data: {
        cartItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/:id
 * @access Private
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find cart item
    const cartItem = await Cart.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!cartItem) {
      return next(new AppError('Cart item not found', 404));
    }

    // Delete cart item
    await cartItem.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * @route DELETE /api/cart
 * @access Private
 */
exports.clearCart = async (req, res, next) => {
  try {
    // Delete all cart items for user
    await Cart.destroy({
      where: {
        userId: req.user.id
      }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 