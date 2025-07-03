const { validationResult } = require('express-validator');
const { Cart, Product, Restaurant, Promotion, Address } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/database');

/**
 * Get user cart with details
 * @route GET /api/cart
 * @access Private
 */
exports.getCart = async (req, res, next) => {
  try {
    // Get user's cart items with joined product and restaurant data
    // This uses the custom findAll method we defined in the Cart model
    const cart = await Cart.findAll({ userId: req.user.id });

    // Get the session data for any applied promotion
    let appliedPromotion = null;
    if (req.session && req.session.cartPromotion) {
      const promotion = await Promotion.findByPk(req.session.cartPromotion.promotionId);
      if (promotion && promotion.isActive) {
        appliedPromotion = {
          ...promotion,
          discountAmount: req.session.cartPromotion.discountAmount
        };
      } else {
        // If promotion no longer valid, clear it from session
        delete req.session.cartPromotion;
      }
    }

    // Get delivery address & scheduled time from first cart item (all items share same values)
    let deliveryAddress = null;
    let scheduledDelivery = null;
    if (cart.length > 0) {
      const firstItem = cart[0];
      if (firstItem.deliveryAddressId) {
        deliveryAddress = await Address.findByPk(firstItem.deliveryAddressId);
        if (deliveryAddress && deliveryAddress.user_id !== req.user.id) {
          deliveryAddress = null;
        }
      }
      if (firstItem.scheduledTime) {
        scheduledDelivery = {
          time: firstItem.scheduledTime,
          isScheduled: true
        };
      }
    }

    // Group cart items by restaurant
    const cartByRestaurant = cart.reduce((acc, item) => {
      const restaurantId = item.restaurantId;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          restaurant: {
            id: item.restaurantId,
            name: item.restaurant_name,
            deliveryFee: item.deliveryFee,
            minOrderAmount: item.minOrderAmount,
            estimatedDeliveryTime: item.estimatedDeliveryTime,
            logo: item.logo,
            rating: item.rating
          },
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
      
      const basePrice = item.discountPrice || item.price;
      const itemTotal = item.quantity * (parseFloat(basePrice) + optionsTotal);
      
      acc[restaurantId].items.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        name: item.product_name,
        price: item.price,
        discountPrice: item.discountPrice,
        image: item.image,
        options: item.options,
        notes: item.notes,
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
    const product = await Product.findByPk(productId);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.status !== 'available') {
      return next(new AppError('Product is not available', 400));
    }

    // Get the restaurant info
    const restaurant = await Restaurant.findByPk(product.restaurantId);
    
    // Check if restaurant is active
    if (!restaurant.isActive) {
      return next(new AppError('Restaurant is not active', 400));
    }

    // Get product options (if needed)
    let productOptions = [];
    if (options) {
      // Fetch product options from the database
      productOptions = await db.query(
        'SELECT * FROM product_options WHERE product_id = ?', 
        [productId]
      );
    }

    // Validate option selections against available options
    let validatedOptions = null;
    if (options) {
      validatedOptions = {};
      const providedOptions = typeof options === 'string' ? JSON.parse(options) : options;
      
      // Validate each option
      for (const optionId in providedOptions) {
        const selectedOption = providedOptions[optionId];
        const productOption = productOptions.find(opt => opt.id.toString() === optionId);
        
        if (!productOption) {
          return next(new AppError(`Option with ID ${optionId} not found for this product`, 400));
        }
        
        // Get option choices
        const optionChoices = await db.query(
          'SELECT * FROM product_option_choices WHERE option_id = ?',
          [optionId]
        );
        
        // Handle different option types (single, multiple)
        if (productOption.type === 'single' && typeof selectedOption === 'object') {
          // Validate the selected choice exists
          const validChoice = optionChoices.find(c => c.id.toString() === selectedOption.id.toString());
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
            const validChoice = optionChoices.find(c => c.id.toString() === choice.id.toString());
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
    const existingCartItems = await Cart.findAll({ userId: req.user.id });
    
    if (existingCartItems.length > 0) {
      // Check if any items are from a different restaurant
      const existingRestaurantId = existingCartItems[0].restaurantId;
      
      if (existingRestaurantId && existingRestaurantId !== product.restaurantId) {
        return next(new AppError('You already have items from another restaurant in your cart. Please clear your cart first.', 400));
      }
    }

    // Check if similar item exists in cart
    const existingSimilarItems = await db.query(
      `SELECT * FROM ${Cart.tableName} WHERE userId = ? AND productId = ?`,
      [req.user.id, productId]
    );
    
    let existingSimilarItem = null;
    if (existingSimilarItems.length > 0) {
      // Check if options match
      const optionsHash = validatedOptions ? JSON.stringify(validatedOptions) : '';
      
      existingSimilarItem = existingSimilarItems.find(item => {
        const itemOptionsHash = item.options ? JSON.stringify(item.options) : '';
        return itemOptionsHash === optionsHash;
      });
    }

    if (existingSimilarItem) {
      // Update quantity
      const newQuantity = existingSimilarItem.quantity + parseInt(quantity);
      const updatedNotes = notes || existingSimilarItem.notes;
      
      await Cart.update(existingSimilarItem.id, {
        quantity: newQuantity,
        notes: updatedNotes
      });
      
      // Return the updated cart item
      const updatedItem = await Cart.findByPk(existingSimilarItem.id);

      return res.status(200).json({
        status: 'success',
        message: 'Cart item quantity updated',
        data: {
          cartItem: updatedItem
        }
      });
    } else {
      // Create new cart item
      let deliveryAddressId = null;
      let scheduledTime = null;
      if (existingCartItems.length > 0) {
        deliveryAddressId = existingCartItems[0].deliveryAddressId || null;
        scheduledTime = existingCartItems[0].scheduledTime || null;
      }

      const cartItem = await Cart.create({
        userId: req.user.id,
        productId,
        quantity: parseInt(quantity),
        options: validatedOptions,
        notes,
        deliveryAddressId,
        scheduledTime
      });

      return res.status(201).json({
        status: 'success',
        message: 'Item added to cart',
        data: {
          cartItem
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
    
    // Update all cart items for the user with the selected address
    await db.query(
      `UPDATE ${Cart.tableName} SET deliveryAddressId = ? WHERE userId = ?`,
      [addressId, req.user.id]
    );
    
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
    const { type = 'asap', scheduledTime } = req.body;
    
    let scheduledDate = null;
    if (type === 'scheduled') {
      if (!scheduledTime) {
        return next(new AppError('scheduledTime is required for scheduled delivery', 400));
      }
      scheduledDate = new Date(scheduledTime);

      const now = new Date();
      if (scheduledDate <= new Date(now.getTime() + 30 * 60000)) { // at least 30 minutes ahead
        return next(new AppError('Scheduled time must be at least 30 minutes in the future', 400));
      }

      const maxScheduleWindow = new Date();
      maxScheduleWindow.setDate(maxScheduleWindow.getDate() + 7);
      if (scheduledDate > maxScheduleWindow) {
        return next(new AppError('Cannot schedule delivery more than 7 days in advance', 400));
      }
    }

    // Update all cart items
    await db.query(
      `UPDATE ${Cart.tableName} SET scheduledTime = ? WHERE userId = ?`,
      [scheduledDate, req.user.id]
    );

    const responseData = type === 'scheduled' ? { time: scheduledDate, isScheduled: true } : { isScheduled: false };
    
    res.status(200).json({
      status: 'success',
      data: {
        scheduledDelivery: responseData
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
    // Clear scheduled time in DB
    await db.query(
      `UPDATE ${Cart.tableName} SET scheduledTime = NULL WHERE userId = ?`,
      [req.user.id]
    );
    
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
    const promotions = await db.query(
      `SELECT * FROM promotions 
       WHERE code = ? 
       AND is_active = 1
       AND start_date <= NOW() 
       AND end_date >= NOW()`,
      [code.toUpperCase()]
    );
    
    if (!promotions || promotions.length === 0) {
      return next(new AppError('Invalid or expired promotion code', 400));
    }
    
    const promotion = promotions[0];
    
    // Get user cart
    const cartItems = await Cart.findAll({ userId: req.user.id });
    
    if (cartItems.length === 0) {
      return next(new AppError('Your cart is empty', 400));
    }
    
    // Check if promotion is restaurant-specific
    if (promotion.restaurantId) {
      const restaurantId = cartItems[0].restaurantId;
      if (promotion.restaurantId !== restaurantId) {
        return next(new AppError('This promotion code is not valid for the selected restaurant', 400));
      }
    }
    
    // Calculate cart subtotal
    const subtotal = cartItems.reduce((total, item) => {
      return total + (item.quantity * (item.discountPrice || item.price));
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
      const userPromotions = await db.query(
        `SELECT COUNT(*) as count FROM user_promotions 
         WHERE userId = ? AND promotionId = ?`,
        [req.user.id, promotion.id]
      );
      
      const userUsageCount = userPromotions[0].count;
      if (userUsageCount >= promotion.userUsageLimit) {
        return next(new AppError('You have already used this promotion', 400));
      }
    }
    
    // Check if promotion is for new users only
    if (promotion.forNewUsersOnly) {
      const userOrders = await db.query(
        `SELECT COUNT(*) as count FROM orders WHERE userId = ?`,
        [req.user.id]
      );
      
      if (userOrders[0].count > 0) {
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
      // Get the restaurant's delivery fee
      const restaurantId = cartItems[0].restaurantId;
      const restaurants = await db.query(
        'SELECT deliveryFee FROM restaurants WHERE id = ?',
        [restaurantId]
      );
      
      if (restaurants && restaurants.length > 0) {
        discountAmount = parseFloat(restaurants[0].deliveryFee);
      }
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
          ...promotion,
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
    const cartItems = await db.query(
      `SELECT * FROM ${Cart.tableName} WHERE id = ? AND userId = ?`,
      [id, req.user.id]
    );

    if (!cartItems || cartItems.length === 0) {
      return next(new AppError('Cart item not found', 404));
    }

    // Prepare data to update
    const updateData = {};
    if (quantity) updateData.quantity = quantity;
    if (notes !== undefined) updateData.notes = notes;
    if (options) updateData.options = JSON.stringify(typeof options === 'string' ? JSON.parse(options) : options);

    // Update cart item
    await Cart.update(id, updateData);

    // Get updated cart item
    const updatedCartItem = await Cart.findByPk(id);

    res.status(200).json({
      status: 'success',
      data: {
        cartItem: updatedCartItem
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
    const cartItems = await db.query(
      `SELECT * FROM ${Cart.tableName} WHERE id = ? AND userId = ?`,
      [id, req.user.id]
    );

    if (!cartItems || cartItems.length === 0) {
      return next(new AppError('Cart item not found', 404));
    }

    // Delete cart item
    await Cart.destroy(id);

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
    await db.query(
      `DELETE FROM ${Cart.tableName} WHERE userId = ?`,
      [req.user.id]
    );

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};