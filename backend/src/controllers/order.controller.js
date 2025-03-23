const { validationResult } = require('express-validator');
const { Order, OrderDetail, Product, Restaurant, User, Cart } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { emitToOrder, emitToUser } = require('../socket/handlers');

/**
 * Get user orders
 * @route GET /api/orders
 * @access Private
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = { userId: req.user.id };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get orders
    const orders = await Order.findAndCountAll({
      where: filter,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo', 'address']
        },
        {
          model: OrderDetail,
          as: 'orderDetails',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: orders.count,
      totalPages: Math.ceil(orders.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        orders: orders.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order details
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find order
    const order = await Order.findOne({
      where: {
        id,
        userId: req.user.id
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo', 'address', 'phone']
        },
        {
          model: OrderDetail,
          as: 'orderDetails',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'image', 'price']
            }
          ]
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'phone', 'profileImage']
        }
      ]
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create order from cart
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res, next) => {
  try {
    const {
      paymentMethod,
      deliveryInstructions
    } = req.body;

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
              as: 'restaurant',
              attributes: ['id', 'name', 'deliveryFee', 'minOrderAmount']
            }
          ]
        }
      ]
    });

    if (cart.length === 0) {
      return next(new AppError('Your cart is empty', 400));
    }

    // Get restaurant details
    const restaurantId = cart[0].product.restaurantId;
    const restaurant = cart[0].product.restaurant;

    // Calculate subtotal
    let subtotal = 0;
    let itemsWithOptions = [];

    cart.forEach(item => {
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
      
      subtotal += itemTotal;
      
      // Save item with options details for order items
      itemsWithOptions.push({
        item,
        optionsTotal,
        itemTotal
      });
    });

    // Check minimum order amount
    if (subtotal < restaurant.minOrderAmount) {
      return next(new AppError(`Minimum order amount of $${restaurant.minOrderAmount} required`, 400));
    }

    // Get delivery address
    let deliveryAddress;
    if (req.session && req.session.deliveryAddressId) {
      deliveryAddress = await Address.findOne({
        where: { id: req.session.deliveryAddressId, userId: req.user.id }
      });
    }

    if (!deliveryAddress) {
      return next(new AppError('Delivery address is required', 400));
    }

    // Format address for order
    const formattedAddress = `${deliveryAddress.addressLine1}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.postalCode}`;

    // Calculate tax and delivery fee
    const taxRate = 0.08; // 8% tax rate - should be configurable
    const taxAmount = subtotal * taxRate;
    const deliveryFee = parseFloat(restaurant.deliveryFee);

    // Apply promotion if available
    let discountAmount = 0;
    let appliedPromotionId = null;

    if (req.session && req.session.cartPromotion) {
      const promotion = await Promotion.findByPk(req.session.cartPromotion.promotionId);
      
      if (promotion && promotion.isActive) {
        // Calculate discount based on promotion type
        if (promotion.type === 'percentage') {
          discountAmount = (subtotal * promotion.value / 100);
          // Apply max discount limit if set
          if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
            discountAmount = parseFloat(promotion.maxDiscountAmount);
          }
        } else if (promotion.type === 'fixed_amount') {
          discountAmount = parseFloat(promotion.value);
        } else if (promotion.type === 'free_delivery') {
          discountAmount = deliveryFee;
        }
        
        appliedPromotionId = promotion.id;
      }
    }

    // Calculate total
    const totalAmount = subtotal + taxAmount + deliveryFee - discountAmount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Determine estimated delivery time
    let estimatedDeliveryTime;
    if (req.session && req.session.scheduledDelivery) {
      // Use scheduled time
      estimatedDeliveryTime = new Date(req.session.scheduledDelivery.time);
    } else {
      // Calculate based on restaurant's estimatedDeliveryTime (in minutes)
      estimatedDeliveryTime = new Date();
      estimatedDeliveryTime.setMinutes(
        estimatedDeliveryTime.getMinutes() + 
        (restaurant.estimatedDeliveryTime || 45) // Default to 45 minutes if not set
      );
    }

    // Get special instructions
    const customerNote = req.session?.specialInstructions || '';

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      orderNumber,
      status: 'pending',
      totalAmount,
      subtotal,
      taxAmount,
      deliveryFee,
      discountAmount,
      paymentMethod,
      paymentStatus: 'pending',
      deliveryAddress: formattedAddress,
      deliveryInstructions: deliveryInstructions || '',
      estimatedDeliveryTime,
      customerNote,
      isScheduled: req.session?.scheduledDelivery?.isScheduled || false
    });

    // Create order items
    const orderItems = await Promise.all(itemsWithOptions.map(async ({ item, optionsTotal, itemTotal }) => {
      return OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.product.discountPrice || item.product.price) + optionsTotal,
        totalPrice: itemTotal,
        options: item.options,
        notes: item.notes
      });
    }));

    // Record the promotion usage if applied
    if (appliedPromotionId) {
      await UserPromotion.create({
        userId: req.user.id,
        promotionId: appliedPromotionId,
        orderId: order.id,
        discountAmount,
        orderTotal: subtotal // Pre-discount total
      });

      // Increment promotion usage count
      await Promotion.increment('usageCount', {
        where: { id: appliedPromotionId }
      });
    }

    // Clear cart after successful order
    await Cart.destroy({
      where: { userId: req.user.id }
    });

    // Clear session data related to cart
    if (req.session) {
      delete req.session.cartPromotion;
      delete req.session.deliveryAddressId;
      delete req.session.scheduledDelivery;
      delete req.session.specialInstructions;
    }

    // Notify restaurant about new order (e.g., via socket.io)
    if (req.app.get('io')) {
      req.app.get('io').to(`restaurant:${restaurantId}`).emit('new_order', {
        id: order.id,
        orderNumber: order.orderNumber
      });
    }

    // Process payment if not cash
    if (paymentMethod !== 'cash') {
      // Payment processing would go here
      // In a real app, you would call your payment service
      console.log(`Processing payment for order ${order.id}`);
    }

    // Send confirmation email
    const user = await User.findByPk(req.user.id);
    const restaurantDetails = await Restaurant.findByPk(restaurantId);
    
    await sendOrderConfirmationEmail(
      user.email,
      {
        orderNumber: order.orderNumber,
        customerName: user.fullName,
        restaurantName: restaurantDetails.name,
        orderItems: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.totalPrice
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        tax: order.taxAmount,
        discount: order.discountAmount,
        total: order.totalAmount,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }
    );

    res.status(201).json({
      status: 'success',
      data: {
        order: {
          ...order.toJSON(),
          items: orderItems
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a unique order number
 * @private
 */
const generateOrderNumber = () => {
  const prefix = 'ORD';
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

/**
 * Send order confirmation email
 * @private
 */
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  try {
    // In a real app, this would send an actual email
    // This is just a placeholder
    console.log(`Sending order confirmation email to ${email}`);
    console.log('Order details:', orderDetails);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw an error, as this shouldn't disrupt the order process
  }
};

/**
 * Cancel order
 * @route PATCH /api/orders/:id/cancel
 * @access Private
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Find order
    const order = await Order.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if order can be cancelled
    const allowedStatuses = ['pending', 'confirmed'];
    if (!allowedStatuses.includes(order.status)) {
      return next(new AppError(`Order cannot be cancelled in ${order.status} status`, 400));
    }

    // Update order
    order.status = 'cancelled';
    order.cancellationReason = cancellationReason;
    await order.save();

    // Emit cancellation event
    emitToOrder(order.id, 'order_status_updated', {
      orderId: order.id,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      reason: cancellationReason
    });

    // If driver was assigned, notify them
    if (order.driverId) {
      emitToUser(order.driverId, 'order_cancelled', {
        orderId: order.id,
        reason: cancellationReason
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant orders (for restaurant owners)
 * @route GET /api/orders/restaurant/:restaurantId
 * @access Private (Restaurant Owner)
 */
exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;

    // Check if user is the restaurant owner
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant || (restaurant.userId !== req.user.id && req.user.role !== 'admin')) {
      return next(new AppError('Không có quyền xem đơn hàng của nhà hàng này', 403));
    }

    // Build filter object
    const filter = { restaurantId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get orders
    const orders = await Order.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'phone', 'email']
        },
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: orders.count,
      totalPages: Math.ceil(orders.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        orders: orders.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (for restaurant owners)
 * @route PATCH /api/orders/:id/status
 * @access Private (Restaurant Owner)
 */
exports.updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, estimatedTime, restaurantNote } = req.body;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404));
    }

    // Check permissions - ensure user is restaurant owner, driver, or admin
    const isRestaurantOwner = order.restaurant.userId === req.user.id;
    const isAssignedDriver = order.driverId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isRestaurantOwner && !isAssignedDriver && !isAdmin) {
      await transaction.rollback();
      return next(new AppError('You are not authorized to update this order', 403));
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      await transaction.rollback();
      return next(new AppError(`Cannot transition from ${order.status} to ${status}`, 400));
    }

    // Save the previous status for logging
    const previousStatus = order.status;

    // Update order status and details
    order.status = status;
    if (restaurantNote) {
      order.restaurantNote = restaurantNote;
    }

    // Update estimated delivery time based on status
    if (status === 'confirmed') {
      order.estimatedDeliveryTime = estimatedTime || new Date(Date.now() + 45 * 60000); // Default 45 mins
    } else if (status === 'preparing') {
      // Update prep start time
      order.preparationStartTime = new Date();
    } else if (status === 'ready') {
      // Update prep end time
      order.preparationEndTime = new Date();
    } else if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save({ transaction });
    
    // Log the status change
    const { OrderStatusLog } = require('../models');
    
    // Get geolocation data if available (primarily for drivers)
    let locationData = null;
    if (req.user.role === 'driver' && status === 'out_for_delivery' || status === 'delivered') {
      const { DriverLocation } = require('../models');
      const driverLocation = await DriverLocation.findOne({
        where: { driverId: req.user.id }
      });
      
      if (driverLocation) {
        locationData = sequelize.fn(
          'ST_GeomFromText', 
          `POINT(${driverLocation.longitude} ${driverLocation.latitude})`
        );
      }
    }
    
    // Create status log entry
    await OrderStatusLog.create({
      orderId: order.id,
      status,
      notes: restaurantNote || `Status changed from ${previousStatus} to ${status}`,
      changedById: req.user.id,
      location: locationData,
      metadata: {
        previousStatus,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        changedBy: req.user.role
      }
    }, { transaction });

    await transaction.commit();

    // Emit real-time updates
    emitToOrder(order.id, 'order_status_updated', {
      orderId: order.id,
      status,
      updatedAt: new Date().toISOString(),
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime
    });

    // Send specific notifications based on status
    switch (status) {
      case 'confirmed':
        emitToUser(order.userId, 'order_confirmed', {
          orderId: order.id,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
        break;
      case 'preparing':
        emitToUser(order.userId, 'order_preparing', {
          orderId: order.id,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
        break;
      case 'ready':
        if (order.driverId) {
          emitToUser(order.driverId, 'order_ready', {
            orderId: order.id,
            restaurantId: order.restaurantId
          });
        }
        emitToUser(order.userId, 'order_ready', {
          orderId: order.id
        });
        break;
      case 'out_for_delivery':
        emitToUser(order.userId, 'order_out_for_delivery', {
          orderId: order.id,
          driverId: order.driverId,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
        break;
      case 'delivered':
        emitToUser(order.userId, 'order_delivered', {
          orderId: order.id
        });
        break;
      case 'cancelled':
        emitToUser(order.userId, 'order_cancelled', {
          orderId: order.id,
          reason: restaurantNote
        });
        if (order.driverId) {
          emitToUser(order.driverId, 'order_cancelled', {
            orderId: order.id,
            reason: restaurantNote
          });
        }
        break;
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Assign driver to order (for restaurant owners)
 * @route PATCH /api/orders/:id/assign-driver
 * @access Private (Restaurant Owner)
 */
exports.assignDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    // Find order
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the restaurant owner
    if (order.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this order', 403));
    }

    // Check if driver exists
    const driver = await User.findOne({
      where: {
        id: driverId,
        role: 'driver'
      }
    });

    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    // Update order
    order.driverId = driverId;
    await order.save();

    // Emit driver assignment event
    emitToOrder(order.id, 'driver_assigned', {
      orderId: order.id,
      driver: {
        id: driver.id,
        name: driver.fullName,
        phone: driver.phone,
        profileImage: driver.profileImage
      }
    });

    // Notify the driver
    emitToUser(driverId, 'new_order_assigned', {
      orderId: order.id,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurant.name,
      restaurantAddress: order.restaurant.address,
      deliveryAddress: order.deliveryAddress
    });

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};