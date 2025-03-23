const { validationResult } = require('express-validator');
const { Cart, Product, Restaurant } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

/**
 * Get user cart with details
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
              attributes: ['id', 'name', 'deliveryFee', 'minOrderAmount', 'estimatedDeliveryTime', 'logo', 'rating']
            }
          ]
        }
      ]
    });

    // Get the session data for any applied promotion
    let appliedPromotion = null;
    if (req.session && req.session.cartPromotion) {
      const promotion = await Promotion.findByPk(req.session.cartPromotion.promotionId);
      if (promotion && promotion.isActive) {
        appliedPromotion = {
          ...promotion.toJSON(),
          discountAmount: req.session.cartPromotion.discountAmount
        };
      } else {
        // If promotion no longer valid, clear it from session
        delete req.session.cartPromotion;
      }
    }

    // Get delivery address if set in session
    let deliveryAddress = null;
    if (req.session && req.session.deliveryAddressId) {
      deliveryAddress = await Address.findOne({
        where: { id: req.session.deliveryAddressId, userId: req.user.id }
      });
    }

    // Get scheduled delivery time if set
    const scheduledDelivery = req.session?.scheduledDelivery || null;

    // Group cart items by restaurant
    const cartByRestaurant = cart.reduce((acc, item) => {
      const restaurantId = item.product.restaurantId;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          restaurant: item.product.restaurant,
          items: [],
          subtotal: 0,
          itemOptions: 0, // Additional costs from options
          specialInstructions: req.session?.specialInstructions || ''
        };
      }
      
      // Calculate options cost
      let optionsTotal = 0;
      if (item.options) {
        Object.values(item.options).forEach(option => {
          if (Array.isArray(option)) {
            option.forEach(choice => {
              if (choice.price) optionsTotal += parseFloat(choice.price);
            });
          } else if (option.price) {
            optionsTotal += parseFloat(option.price);
          }
        });
      }
      
      const basePrice = item.product.discountPrice || item.product.price;
      const itemTotal = item.quantity * (parseFloat(basePrice) + optionsTotal);
      
      acc[restaurantId].items.push({
        ...item.toJSON(),
        itemTotal,
        optionsTotal
      });
      
      acc[restaurantId].subtotal += itemTotal;
      acc[restaurantId].itemOptions += (optionsTotal * item.quantity);
      
      return acc;
    }, {});

    // There should only be one restaurant in the cart (as enforced by addToCart)
    const restaurantData = Object.values(cartByRestaurant)[0] || {
      restaurant: null,
      items: [],
      subtotal: 0,
      itemOptions: 0
    };

    // Calculate total and apply discount if promotion exists
    let subtotal = restaurantData.subtotal || 0;
    let discountAmount = 0;
    let deliveryFee = restaurantData.restaurant ? parseFloat(restaurantData.restaurant.deliveryFee) : 0;
    
    if (appliedPromotion) {
      if (appliedPromotion.type === 'percentage') {
        discountAmount = (subtotal * appliedPromotion.value / 100);
        // Apply max discount limit if set
        if (appliedPromotion.maxDiscountAmount && discountAmount > appliedPromotion.maxDiscountAmount) {
          discountAmount = parseFloat(appliedPromotion.maxDiscountAmount);
        }
      } else if (appliedPromotion.type === 'fixed_amount') {
        discountAmount = parseFloat(appliedPromotion.value);
      } else if (appliedPromotion.type === 'free_delivery') {
        discountAmount = deliveryFee;
      }

      // Store the calculated discount
      if (req.session && req.session.cartPromotion) {
        req.session.cartPromotion.discountAmount = discountAmount;
      }
    }

    // Calculate total with tax and delivery fee
    const taxRate = 0.08; // 8% tax rate - should be configurable
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount + deliveryFee - discountAmount;

    res.status(200).json({
      status: 'success',
      data: {
        restaurant: restaurantData.restaurant,
        items: restaurantData.items,
        subtotal,
        deliveryFee,
        taxAmount,
        discountAmount,
        total,
        itemOptions: restaurantData.itemOptions,
        appliedPromotion,
        deliveryAddress,
        scheduledDelivery,
        specialInstructions: restaurantData.specialInstructions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart with options
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

    const { 
      productId, 
      quantity = 1, 
      options, 
      notes 
    } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        },
        {
          model: ProductOption,
          as: 'options',
          include: [{ model: ProductOptionChoice, as: 'choices' }]
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

    // Validate option selections against available options
    let validatedOptions = null;
    if (options) {
      validatedOptions = {};
      const providedOptions = typeof options === 'string' ? JSON.parse(options) : options;
      
      // Validate each option
      for (const optionId in providedOptions) {
        const selectedOption = providedOptions[optionId];
        const productOption = product.options.find(opt => opt.id.toString() === optionId);
        
        if (!productOption) {
          return next(new AppError(`Option with ID ${optionId} not found for this product`, 400));
        }
        
        // Handle different option types (single, multiple)
        if (productOption.type === 'single' && typeof selectedOption === 'object') {
          // Validate the selected choice exists
          const validChoice = productOption.choices.find(c => c.id.toString() === selectedOption.id.toString());
          if (!validChoice) {
            return next(new AppError(`Invalid choice for option ${productOption.name}`, 400));
          }
          validatedOptions[optionId] = {
            id: selectedOption.id,
            name: validChoice.name,
            price: validChoice.price
          };
        } else if (productOption.type === 'multiple' && Array.isArray(selectedOption)) {
          // Validate each selected choice
          const validChoices = [];
          for (const choice of selectedOption) {
            const validChoice = productOption.choices.find(c => c.id.toString() === choice.id.toString());
            if (!validChoice) {
              return next(new AppError(`Invalid choice for option ${productOption.name}`, 400));
            }
            validChoices.push({
              id: choice.id,
              name: validChoice.name,
              price: validChoice.price
            });
          }
          validatedOptions[optionId] = validChoices;
        } else {
          return next(new AppError(`Invalid format for option ${productOption.name}`, 400));
        }
      }
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

    // Generate a unique key for this item based on product ID and selected options
    // This allows the same product with different options to be separate cart items
    const optionsHash = validatedOptions ? JSON.stringify(validatedOptions) : '';
    const itemKey = `${productId}-${optionsHash}`;

    // Check if similar item exists in cart
    const existingSimilarItem = await Cart.findOne({
      where: {
        userId: req.user.id,
        productId,
        options: validatedOptions
      }
    });

    if (existingSimilarItem) {
      // Update quantity
      existingSimilarItem.quantity += parseInt(quantity);
      existingSimilarItem.notes = notes || existingSimilarItem.notes;
      await existingSimilarItem.save();
      
      // Return the updated cart item with product details
      const updatedItem = await Cart.findByPk(existingSimilarItem.id, {
        include: [{ model: Product, as: 'product' }]
      });

      return res.status(200).json({
        status: 'success',
        message: 'Cart item quantity updated',
        data: {
          cartItem: updatedItem
        }
      });
    } else {
      // Create new cart item
      const cartItem = await Cart.create({
        userId: req.user.id,
        productId,
        quantity: parseInt(quantity),
        options: validatedOptions,
        notes
      });
      
      // Return the new cart item with product details
      const newItem = await Cart.findByPk(cartItem.id, {
        include: [{ model: Product, as: 'product' }]
      });

      return res.status(201).json({
        status: 'success',
        message: 'Item added to cart',
        data: {
          cartItem: newItem
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Set special instructions for the entire order
 * @route POST /api/cart/instructions
 * @access Private
 */
exports.setSpecialInstructions = async (req, res, next) => {
  try {
    const { instructions } = req.body;
    
    // Store in session
    if (!req.session) {
      req.session = {};
    }
    
    req.session.specialInstructions = instructions || '';
    
    res.status(200).json({
      status: 'success',
      data: {
        specialInstructions: req.session.specialInstructions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set delivery address for the order
 * @route POST /api/cart/address
 * @access Private
 */
exports.setDeliveryAddress = async (req, res, next) => {
  try {
    const { addressId } = req.body;
    
    // Verify the address belongs to the user
    const address = await Address.findOne({
      where: { id: addressId, userId: req.user.id }
    });
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    // Store in session
    if (!req.session) {
      req.session = {};
    }
    
    req.session.deliveryAddressId = addressId;
    
    res.status(200).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule delivery time
 * @route POST /api/cart/schedule
 * @access Private
 */
exports.scheduleDelivery = async (req, res, next) => {
  try {
    const { scheduledTime } = req.body;
    
    // Validate the scheduled time is in the future
    const now = new Date();
    const scheduledDate = new Date(scheduledTime);
    
    if (scheduledDate <= now) {
      return next(new AppError('Scheduled time must be in the future', 400));
    }
    
    // Maximum scheduling window (e.g., 7 days in advance)
    const maxScheduleWindow = new Date();
    maxScheduleWindow.setDate(maxScheduleWindow.getDate() + 7);
    
    if (scheduledDate > maxScheduleWindow) {
      return next(new AppError('Cannot schedule delivery more than 7 days in advance', 400));
    }
    
    // Store in session
    if (!req.session) {
      req.session = {};
    }
    
    req.session.scheduledDelivery = {
      time: scheduledTime,
      isScheduled: true
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        scheduledDelivery: req.session.scheduledDelivery
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel scheduled delivery (revert to ASAP)
 * @route DELETE /api/cart/schedule
 * @access Private
 */
exports.cancelScheduledDelivery = async (req, res, next) => {
  try {
    // Remove from session
    if (req.session) {
      delete req.session.scheduledDelivery;
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Scheduled delivery cancelled'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply promotion code to cart
 * @route POST /api/cart/promotion
 * @access Private
 */
exports.applyPromotion = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    // Find active promotion by code
    const promotion = await Promotion.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });
    
    if (!promotion) {
      return next(new AppError('Invalid or expired promotion code', 400));
    }
    
    // Get user cart
    const cart = await Cart.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: Restaurant,
              as: 'restaurant'
            }
          ]
        }
      ]
    });
    
    if (cart.length === 0) {
      return next(new AppError('Your cart is empty', 400));
    }
    
    // Check if promotion is restaurant-specific
    if (promotion.restaurantId) {
      const restaurantId = cart[0].product.restaurantId;
      if (promotion.restaurantId !== restaurantId) {
        return next(new AppError('This promotion code is not valid for the selected restaurant', 400));
      }
    }
    
    // Calculate cart subtotal
    const subtotal = cart.reduce((total, item) => {
      return total + (item.quantity * (item.product.discountPrice || item.product.price));
    }, 0);
    
    // Check minimum order amount
    if (promotion.minOrderAmount && subtotal < promotion.minOrderAmount) {
      return next(new AppError(`Minimum order amount of $${promotion.minOrderAmount} required for this promotion`, 400));
    }
    
    // Check if promotion usage limit is reached
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return next(new AppError('This promotion has reached its usage limit', 400));
    }
    
    // Check if user has already used this promotion
    if (promotion.userUsageLimit) {
      const userUsageCount = await UserPromotion.count({
        where: {
          userId: req.user.id,
          promotionId: promotion.id
        }
      });
      
      if (userUsageCount >= promotion.userUsageLimit) {
        return next(new AppError('You have already used this promotion', 400));
      }
    }
    
    // Check if promotion is for new users only
    if (promotion.forNewUsersOnly) {
      const userOrders = await Order.count({
        where: { userId: req.user.id }
      });
      
      if (userOrders > 0) {
        return next(new AppError('This promotion is for new users only', 400));
      }
    }
    
    // Calculate discount amount (will be saved when getting cart)
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = (subtotal * promotion.value / 100);
      // Apply max discount limit if set
      if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
        discountAmount = parseFloat(promotion.maxDiscountAmount);
      }
    } else if (promotion.type === 'fixed_amount') {
      discountAmount = parseFloat(promotion.value);
    } else if (promotion.type === 'free_delivery') {
      discountAmount = parseFloat(cart[0].product.restaurant.deliveryFee);
    }
    
    // Store promotion in session
    if (!req.session) {
      req.session = {};
    }
    
    req.session.cartPromotion = {
      promotionId: promotion.id,
      code: promotion.code,
      discountAmount
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        promotion: {
          ...promotion.toJSON(),
          discountAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove promotion from cart
 * @route DELETE /api/cart/promotion
 * @access Private
 */
exports.removePromotion = async (req, res, next) => {
  try {
    // Remove from session
    if (req.session && req.session.cartPromotion) {
      delete req.session.cartPromotion;
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Promotion removed'
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