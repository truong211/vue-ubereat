const { validationResult } = require('express-validator');
const { Order, User, PaymentHistory } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const uuid = require('uuid').v4;

/**
 * Process payment with Stripe
 * @route POST /api/payments/process
 * @access Private
 */
exports.processPayment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, paymentMethodId } = req.body;

    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id,
        paymentStatus: 'pending'
      }
    });

    if (!order) {
      return next(new AppError('Order not found or already paid', 404));
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      description: `Payment for order ${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: req.user.id
      }
    });

    // Update order payment status
    order.paymentStatus = 'paid';
    order.paymentId = paymentIntent.id;
    order.paymentMethod = 'card';
    await order.save();
    
    // Create payment history record
    await PaymentHistory.create({
      orderId: order.id,
      userId: req.user.id,
      amount: order.totalAmount,
      paymentMethod: 'card',
      status: 'completed',
      transactionId: paymentIntent.id,
      paymentDetails: paymentIntent,
      notes: `Payment processed for order ${order.orderNumber}`
    });

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntent: paymentIntent.id,
        order
      }
    });
  } catch (error) {
    if (error.type === 'StripeCardError') {
      return next(new AppError(error.message, 400));
    }
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status
 * @route GET /api/payments/:orderId
 * @access Private
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id
      }
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // If payment was made with Stripe, get payment details
    let paymentDetails = null;
    if (order.paymentId && order.paymentMethod === 'card') {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId);
      paymentDetails = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        created: new Date(paymentIntent.created * 1000),
        paymentMethod: paymentIntent.payment_method
      };

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
    }

    res.status(200).json({
      status: 'success',
      data: {
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment intent (for mobile apps)
 * @route POST /api/payments/create-intent
 * @access Private
 */
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id,
        paymentStatus: 'pending'
      }
    });

    if (!order) {
      return next(new AppError('Order not found or already paid', 404));
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: req.user.id
      }
    });

    // Save payment intent ID to order
    order.paymentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook
 * @route POST /api/payments/webhook
 * @access Public
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Update order payment status
        if (paymentIntent.metadata && paymentIntent.metadata.orderId) {
          const order = await Order.findByPk(paymentIntent.metadata.orderId);
          if (order) {
            order.paymentStatus = 'paid';
            await order.save();
            
            // Create or update payment history record
            const paymentRecord = await PaymentHistory.findOne({
              where: {
                orderId: order.id,
                transactionId: paymentIntent.id
              }
            });
            
            if (paymentRecord) {
              paymentRecord.status = 'completed';
              paymentRecord.paymentDetails = paymentIntent;
              await paymentRecord.save();
            } else {
              await PaymentHistory.create({
                orderId: order.id,
                userId: paymentIntent.metadata.userId,
                amount: order.totalAmount,
                paymentMethod: 'card',
                status: 'completed',
                transactionId: paymentIntent.id,
                paymentDetails: paymentIntent,
                notes: `Payment completed for order ${order.orderNumber} via webhook`
              });
            }
          }
        }
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        // Update order payment status
        if (failedPayment.metadata && failedPayment.metadata.orderId) {
          const order = await Order.findByPk(failedPayment.metadata.orderId);
          if (order) {
            order.paymentStatus = 'failed';
            await order.save();
            
            // Create or update payment history record
            const paymentRecord = await PaymentHistory.findOne({
              where: {
                orderId: order.id,
                transactionId: failedPayment.id
              }
            });
            
            if (paymentRecord) {
              paymentRecord.status = 'failed';
              paymentRecord.paymentDetails = failedPayment;
              await paymentRecord.save();
            } else {
              await PaymentHistory.create({
                orderId: order.id,
                userId: failedPayment.metadata.userId,
                amount: order.totalAmount,
                paymentMethod: 'card',
                status: 'failed',
                transactionId: failedPayment.id,
                paymentDetails: failedPayment,
                notes: `Payment failed for order ${order.orderNumber}`
              });
            }
          }
        }
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process cash payment
 * @route POST /api/payments/cash
 * @access Private
 */
exports.processCashPayment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;

    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id,
        paymentStatus: 'pending'
      }
    });

    if (!order) {
      return next(new AppError('Order not found or already paid', 404));
    }

    // Update order payment status to pending (will be marked as paid upon delivery)
    order.paymentMethod = 'cash';
    await order.save();

    // Create payment history record
    await PaymentHistory.create({
      orderId: order.id,
      userId: req.user.id,
      amount: order.totalAmount,
      paymentMethod: 'cash',
      status: 'pending',
      notes: 'Cash payment to be collected upon delivery'
    });

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Cash payment option selected. Payment will be collected upon delivery.',
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm cash payment (for delivery personnel)
 * @route POST /api/payments/cash/confirm
 * @access Private (Driver)
 */
exports.confirmCashPayment = async (req, res, next) => {
  try {
    const { orderId, amountCollected } = req.body;

    // Check if user is a driver
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to perform this action', 403));
    }

    // Find order
    const order = await Order.findOne({
      where: {
        id: orderId,
        paymentMethod: 'cash',
        status: 'out_for_delivery'
      }
    });

    if (!order) {
      return next(new AppError('Order not found or not eligible for cash payment confirmation', 404));
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    await order.save();

    // Update payment history
    const paymentRecord = await PaymentHistory.findOne({
      where: {
        orderId: order.id,
        paymentMethod: 'cash',
        status: 'pending'
      }
    });

    if (paymentRecord) {
      paymentRecord.status = 'completed';
      paymentRecord.paymentDetails = { amountCollected };

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
      paymentRecord.notes += ' | Confirmed by driver ID: ' + req.user.id;
      await paymentRecord.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Cash payment confirmed',
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund payment
 * @route POST /api/payments/refund
 * @access Private (Admin)
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to perform this action', 403));
    }

    // Find order
    const order = await Order.findByPk(orderId);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.paymentStatus !== 'paid' || !order.paymentId) {
      return next(new AppError('Order has not been paid or payment ID is missing', 400));
    }

    // Process refund
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
      reason: reason || 'requested_by_customer'
    });

    // Update order payment status
    order.paymentStatus = amount && amount < order.totalAmount ? 'partially_refunded' : 'refunded';
    order.refundId = refund.id;
    order.refundAmount = amount || order.totalAmount;
    await order.save();
    
    // Create payment history record for the refund
    await PaymentHistory.create({
      orderId: order.id,
      userId: req.user.id,
      amount: amount || order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentType: 'refund',
      status: 'completed',
      transactionId: refund.id,
      paymentDetails: refund,
      notes: reason || 'Refund processed by admin'
    });

    res.status(200).json({
      status: 'success',
      data: {
        refund,
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user payment history
 * @route GET /api/payments/history
 * @access Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find payment history for the user
    const paymentHistory = await PaymentHistory.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          attributes: ['orderNumber', 'status', 'totalAmount', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(paymentHistory.count / limit);
    
    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentHistory.rows,
        pagination: {
          total: paymentHistory.count,
          totalPages,
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};