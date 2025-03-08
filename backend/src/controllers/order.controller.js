const { validationResult } = require('express-validator');
const { Order, OrderDetail, Product, Restaurant, User, Cart } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

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
 * Create order
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res, next) => {
  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      restaurantId,
      deliveryAddress,
      deliveryInstructions,
      paymentMethod,
      customerNote,
      items
    } = req.body;

    // Check if restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      await transaction.rollback();
      return next(new AppError('Restaurant not found', 404));
    }

    // Check if restaurant is active
    if (!restaurant.isActive) {
      await transaction.rollback();
      return next(new AppError('Restaurant is not active', 400));
    }

    // If items are not provided, get from cart
    let orderItems = items;
    if (!orderItems || orderItems.length === 0) {
      const cartItems = await Cart.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: Product,
            as: 'product',
            where: { restaurantId }
          }
        ]
      });

      if (cartItems.length === 0) {
        await transaction.rollback();
        return next(new AppError('Cart is empty', 400));
      }

      orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
        options: item.options
      }));
    }

    // Validate items
    if (!orderItems || orderItems.length === 0) {
      await transaction.rollback();
      return next(new AppError('No items in order', 400));
    }

    // Get products
    const productIds = orderItems.map(item => item.productId);
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        restaurantId,
        status: 'available'
      }
    });

    if (products.length !== productIds.length) {
      await transaction.rollback();
      return next(new AppError('Some products are not available', 400));
    }

    // Calculate order total
    let subtotal = 0;
    const orderDetails = [];

    for (const item of orderItems) {
      const product = products.find(p => p.id === parseInt(item.productId));
      const price = product.discountPrice || product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderDetails.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        subtotal: itemTotal,
        notes: item.notes,
        options: item.options
      });
    }

    // Check if order meets minimum order amount
    if (subtotal < restaurant.minOrderAmount) {
      await transaction.rollback();
      return next(new AppError(`Order does not meet minimum order amount of ${restaurant.minOrderAmount}`, 400));
    }

    // Calculate taxes and delivery fee
    const taxRate = 0.1; // 10% tax
    const taxAmount = subtotal * taxRate;
    const deliveryFee = restaurant.deliveryFee || 0;
    const totalAmount = subtotal + taxAmount + deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4)}`;

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
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
      deliveryAddress,
      deliveryInstructions,
      customerNote,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000) // 45 minutes from now
    }, { transaction });

    // Create order details
    for (const detail of orderDetails) {
      await OrderDetail.create({
        orderId: order.id,
        ...detail
      }, { transaction });
    }

    // Clear cart
    await Cart.destroy({
      where: { userId: req.user.id },
      transaction
    });

    // Commit transaction
    await transaction.commit();

    // Get complete order with details
    const completeOrder = await Order.findByPk(order.id, {
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
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      data: {
        order: completeOrder
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    next(error);
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
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user is the restaurant owner
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to view these orders', 403));
    }

    // Build filter object
    const filter = { restaurantId };
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
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'phone', 'profileImage']
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
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'fullName', 'phone', 'profileImage']
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
 * Update order status (for restaurant owners)
 * @route PATCH /api/orders/:id/status
 * @access Private (Restaurant Owner)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, restaurantNote } = req.body;

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
      return next(new AppError(`Cannot transition from ${order.status} to ${status}`, 400));
    }

    // Update order
    order.status = status;
    if (restaurantNote) {
      order.restaurantNote = restaurantNote;
    }

    // Update delivery time if status is out_for_delivery
    if (status === 'out_for_delivery') {
      order.estimatedDeliveryTime = new Date(Date.now() + 30 * 60000); // 30 minutes from now
    }

    // Update actual delivery time if status is delivered
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

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