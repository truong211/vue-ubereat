const db = require('../config/database');
const logger = require('../utils/logger');
const NotificationService = require('../services/notification.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateOrderNumber } = require('../utils/helpers');
const { AppError } = require('../utils/errors');

/**
 * Get user orders
 * @route GET /api/orders
 * @access Private
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    // First, validate the user is available
    if (!req.user || !req.user.id) {
      logger.error('User not authenticated or missing ID in request');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in again.'
      });
    }

    logger.info(`Fetching orders for user ID: ${req.user.id}`);
    const { status, page = 1, limit = 10 } = req.query;

    // Ensure numbers are properly parsed to avoid SQL argument errors
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Build query and params based on whether status filter is provided
    let query = `
      SELECT 
        o.id,
        o.orderNumber,
        o.status,
        o.totalAmount,
        o.subtotal,
        o.taxAmount,
        o.deliveryFee,
        o.discountAmount,
        o.paymentMethod,
        o.paymentStatus,
        o.deliveryAddress,
        o.createdAt,
        o.updatedAt,
        o.isRated,
        r.id as restaurantId,
        r.name as restaurantName,
        r.logo as restaurantImage,
        r.address as restaurantAddress
      FROM 
        orders o
      JOIN 
        restaurants r ON o.restaurantId = r.id
      WHERE 
        o.userId = ?
    `;
    
    let params = [req.user.id];
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    // Use numeric literals for LIMIT and OFFSET instead of placeholders
    query += ` ORDER BY o.createdAt DESC LIMIT ${limitNum} OFFSET ${offset}`;

    // Execute query with proper parameters
    const orders = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE userId = ?';
    let countParams = [req.user.id];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    const total = countResult[0]?.total || 0;

    // Log successful retrieval
    logger.info(`Found ${orders.length} orders for user ID: ${req.user.id}`);

    // Get order items for all fetched orders
    const orderItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.query(
          `
            SELECT 
              oi.id,
              oi.productId,
              oi.name,
              oi.quantity,
              oi.unitPrice as price,
              oi.totalPrice,
              oi.options,
              oi.notes,
              p.image
            FROM 
              order_items oi
            LEFT JOIN 
              products p ON oi.productId = p.id
            WHERE 
              oi.orderId = ?
          `,
          [order.id]
        );
        return { orderId: order.id, items };
      })
    );

    // Format the orders to match what the frontend expects
    const formattedOrders = orders.map(order => {
      // Find items for this order
      const orderItemsData = orderItems.find(item => item.orderId === order.id)?.items || [];
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.totalAmount,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discountAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        reviewed: order.isRated,
        restaurant: {
          id: order.restaurantId,
          name: order.restaurantName,
          image: order.restaurantImage,
          address: order.restaurantAddress
        },
        items: orderItemsData
      };
    });

    res.status(200).json({
      status: 'success',
      results: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: {
        orders: formattedOrders
      }
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
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

    // Get order with restaurant info
    const order = await db.query(
      `SELECT 
         o.id,
         o.orderNumber,
         o.status,
         o.totalAmount,
         o.subtotal,
         o.taxAmount,
         o.deliveryFee,
         o.discountAmount,
         o.paymentMethod,
         o.paymentStatus,
         o.deliveryAddress,
         o.deliveryInstructions,
         o.estimatedDeliveryTime,
         o.actualDeliveryTime,
         o.customerNote,
         o.restaurantNote,
         o.createdAt,
         o.updatedAt,
         o.isRated,
         r.id as restaurantId,
         r.name as restaurantName,
         r.logo as restaurantImage,
         r.address as restaurantAddress,
         r.phone as restaurantPhone
       FROM 
         orders o
       JOIN 
         restaurants r ON o.restaurantId = r.id
       WHERE 
         o.id = ? AND (o.userId = ? OR ? = 'admin')`,
      [id, req.user.id, req.user.role]
    );

    if (!order || order.length === 0) {
      return next(new AppError('Order not found', 404));
    }

    // Get order items
    const items = await db.query(
      `SELECT 
         oi.id,
         oi.productId,
         oi.name,
         oi.quantity,
         oi.unitPrice as price,
         oi.totalPrice,
         oi.options,
         oi.notes,
         p.image
       FROM 
         order_items oi
       LEFT JOIN 
         products p ON oi.productId = p.id
       WHERE 
         oi.orderId = ?`,
      [id]
    );

    // Get order status history
    const statusHistory = await db.query(
      'SELECT * FROM order_status_logs WHERE orderId = ? ORDER BY createdAt ASC',
      [id]
    );

    const orderData = {
      ...order[0],
      total: order[0].totalAmount,
      discount: order[0].discountAmount,
      restaurant: {
        id: order[0].restaurantId,
        name: order[0].restaurantName,
        image: order[0].restaurantImage,
        address: order[0].restaurantAddress,
        phone: order[0].restaurantPhone
      },
      items: items,
      statusHistory: statusHistory
    };

    // Remove redundant fields
    delete orderData.restaurantId;
    delete orderData.restaurantName;
    delete orderData.restaurantImage;
    delete orderData.restaurantAddress;
    delete orderData.restaurantPhone;
    delete orderData.totalAmount;
    delete orderData.discountAmount;

    res.status(200).json({
      status: 'success',
      data: orderData
    });
  } catch (error) {
    logger.error('Error fetching order details:', error);
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
    const cart = await db.query(
      `
        SELECT 
          ci.*,
          p.restaurantId,
          r.name as restaurantName,
          r.deliveryFee,
          r.minOrderAmount
        FROM 
          cart_items ci
        JOIN 
          products p ON ci.productId = p.id
        JOIN 
          restaurants r ON p.restaurantId = r.id
        WHERE 
          ci.userId = ?
      `,
      [req.user.id]
    );

    if (cart.rows.length === 0) {
      return next(new AppError('Your cart is empty', 400));
    }

    // Get restaurant details
    const restaurantId = cart.rows[0].restaurantId;
    const restaurant = cart.rows[0].restaurantName;

    // Calculate subtotal
    let subtotal = 0;
    let itemsWithOptions = [];

    for (const item of cart.rows) {
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
      
      subtotal += itemTotal;
      
      // Save item with options details for order items
      itemsWithOptions.push({
        item,
        optionsTotal,
        itemTotal
      });
    }

    // Check minimum order amount
    if (subtotal < cart.rows[0].minOrderAmount) {
      return next(new AppError(`Minimum order amount of $${cart.rows[0].minOrderAmount} required`, 400));
    }

    // Get delivery address
    let deliveryAddress;
    if (req.session && req.session.deliveryAddressId) {
      deliveryAddress = await db.query(
        'SELECT * FROM addresses WHERE id = ? AND userId = ?',
        [req.session.deliveryAddressId, req.user.id]
      );
    }

    if (!deliveryAddress) {
      return next(new AppError('Delivery address is required', 400));
    }

    // Format address for order
    const formattedAddress = `${deliveryAddress.rows[0].addressLine1}, ${deliveryAddress.rows[0].city}, ${deliveryAddress.rows[0].state} ${deliveryAddress.rows[0].postalCode}`;

    // Calculate tax and delivery fee
    const taxRate = 0.08; // 8% tax rate - should be configurable
    const taxAmount = subtotal * taxRate;
    const deliveryFee = parseFloat(cart.rows[0].deliveryFee);

    // Apply promotion if available
    let discountAmount = 0;
    let appliedPromotionId = null;

    if (req.session && req.session.cartPromotion) {
      const promotion = await db.query(
        'SELECT * FROM promotions WHERE id = ?',
        [req.session.cartPromotion.promotionId]
      );
      
      if (promotion.rows.length > 0 && promotion.rows[0].isActive) {
        // Calculate discount based on promotion type
        if (promotion.rows[0].type === 'percentage') {
          discountAmount = (subtotal * promotion.rows[0].value / 100);
          // Apply max discount limit if set
          if (promotion.rows[0].maxDiscountAmount && discountAmount > promotion.rows[0].maxDiscountAmount) {
            discountAmount = parseFloat(promotion.rows[0].maxDiscountAmount);
          }
        } else if (promotion.rows[0].type === 'fixed_amount') {
          discountAmount = parseFloat(promotion.rows[0].value);
        } else if (promotion.rows[0].type === 'free_delivery') {
          discountAmount = deliveryFee;
        }
        
        appliedPromotionId = promotion.rows[0].id;
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
        (cart.rows[0].estimatedDeliveryTime || 45) // Default to 45 minutes if not set
      );
    }

    // Get special instructions
    const customerNote = req.session?.specialInstructions || '';

    // Start database transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create order record
      const orderResult = await connection.query(
        `INSERT INTO orders SET ?`,
        {
          orderNumber,
          userId: req.user.id,
          restaurantId,
          status: 'pending',
          totalAmount,
          subtotal,
          taxAmount,
          deliveryFee,
          discountAmount,
          paymentMethod,
          paymentStatus: 'pending',
          deliveryAddress: JSON.stringify(deliveryAddress.rows[0]),
          deliveryInstructions: deliveryInstructions || '',
          estimatedDeliveryTime,
          customerNote,
          isScheduled: req.session?.scheduledDelivery?.isScheduled || false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
      
      const orderId = orderResult.insertId;
      
      // Create order items
      for (const { item, optionsTotal, itemTotal } of itemsWithOptions) {
        await connection.query(
          `INSERT INTO order_items SET ?`,
          {
            orderId,
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: parseFloat(item.discountPrice || item.price) + optionsTotal,
            total: itemTotal,
            options: JSON.stringify(item.options || []),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
      }
      
      // Record the promotion usage if applied
      if (appliedPromotionId) {
        await connection.query(
          `INSERT INTO user_promotions SET ?`,
          {
            userId: req.user.id,
            promotionId: appliedPromotionId,
            orderId,
            discountAmount,
            orderTotal: subtotal // Pre-discount total
          }
        );

        // Increment promotion usage count
        await connection.query(
          'UPDATE promotions SET usageCount = usageCount + 1 WHERE id = ?',
          [appliedPromotionId]
        );
      }
      
      // Clear cart after successful order
      await connection.query(
        'DELETE FROM cart_items WHERE userId = ?',
        [req.user.id]
      );
      
      // Commit transaction
      await connection.commit();
      
      // Notify restaurant about new order
      NotificationService.createNotification({
        userId: cart.rows[0].restaurantId,
        title: 'New Order',
        message: `New order #${orderNumber} has been placed`,
        type: 'new_order',
        data: {
          orderId,
          orderNumber,
          total: totalAmount
        }
      });
      
      // Process payment if not cash
      if (paymentMethod !== 'cash') {
        // Payment processing would go here
        // In a real app, you would call your payment service
        console.log(`Processing payment for order ${orderId}`);
      }

      // Send confirmation email
      const user = await db.query(
        'SELECT email, fullName FROM users WHERE id = ?',
        [req.user.id]
      );
      
      await sendOrderConfirmationEmail(
        user.rows[0].email,
        {
          orderNumber: orderNumber,
          customerName: user.rows[0].fullName,
          restaurantName: restaurant,
          orderItems: itemsWithOptions.map(item => ({
            name: item.item.name,
            quantity: item.item.quantity,
            price: item.itemTotal
          })),
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          tax: taxAmount,
          discount: discountAmount,
          total: totalAmount,
          estimatedDeliveryTime: estimatedDeliveryTime
        }
      );

      res.status(201).json({
        status: 'success',
        data: {
          orderId,
          orderNumber,
          total: totalAmount
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
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
    const userId = req.user.id;
    
    // Get order details
    const [order] = await db.query(
      `SELECT o.*, r.ownerId, r.name as restaurantName
       FROM orders o
       JOIN restaurants r ON o.restaurantId = r.id
       WHERE o.id = ? AND o.userId = ?`,
      [id, userId]
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission'
      });
    }
    
    // Check if order can be cancelled
    if (!['pending', 'preparing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }
    
    // Get time elapsed since order creation (in minutes)
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    const minutesElapsed = Math.floor((currentTime - orderTime) / (1000 * 60));
    
    // Only allow cancellation within 15 minutes of order creation
    if (minutesElapsed > 15 && order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Orders can only be cancelled within 15 minutes of placing'
      });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update order status
      await connection.query(
        'UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?',
        ['cancelled', new Date(), id]
      );
      
      // Add status log
      await connection.query(
        'INSERT INTO order_status_logs SET ?',
        {
          orderId: id,
          status: 'cancelled',
          notes: cancellationReason || 'Cancelled by customer',
          createdAt: new Date(),
          updatedBy: userId
        }
      );
      
      // If payment was made, initiate refund
      if (order.paymentStatus === 'paid' && order.paymentMethod === 'card') {
        const [payment] = await connection.query(
          'SELECT * FROM payment_history WHERE orderId = ? AND status = "completed"',
          [id]
        );
        
        if (payment && payment.transactionId) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: payment.transactionId,
              reason: 'requested_by_customer'
            });
            
            // Record refund
            await connection.query(
              'INSERT INTO payment_history SET ?',
              {
                orderId: id,
                userId,
                amount: -order.totalAmount, // Negative to indicate refund
                paymentMethod: order.paymentMethod,
                status: 'refunded',
                transactionId: refund.id,
                notes: cancellationReason || 'Order cancelled by customer',
                createdAt: new Date()
              }
            );
            
            // Update order payment status
            await connection.query(
              'UPDATE orders SET paymentStatus = ? WHERE id = ?',
              ['refunded', id]
            );
          } catch (refundError) {
            logger.error('Refund error:', refundError);
            // Still cancel the order, but note that refund failed
            await connection.query(
              'UPDATE orders SET paymentStatus = ? WHERE id = ?',
              ['refund_failed', id]
            );
          }
        }
      }
      
      // Commit transaction
      await connection.commit();
      
      // Notify restaurant about cancellation
      NotificationService.createNotification({
        userId: order.ownerId,
        title: 'Order Cancelled',
        message: `Order #${order.orderNumber} has been cancelled by the customer`,
        type: 'order_cancelled',
        data: {
          orderId: id,
          orderNumber: order.orderNumber,
          reason: cancellationReason || 'No reason provided'
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          orderId: id,
          status: 'cancelled'
        }
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Error cancelling order:', error);
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
    const userId = req.user.id;
    
    // Check if user owns the restaurant
    const [restaurant] = await db.query(
      'SELECT * FROM restaurants WHERE id = ? AND ownerId = ?',
      [restaurantId, userId]
    );
    
    if (!restaurant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these orders'
      });
    }
    
    // Query for orders
    let query = `
      SELECT 
        o.*,
        u.fullName as customerName,
        u.phone as customerPhone
      FROM 
        orders o
      JOIN 
        users u ON o.userId = u.id
      WHERE 
        o.restaurantId = ?
    `;
    
    const params = [restaurantId];
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const orders = await db.query(query, params);
    
    // Get count for pagination
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM orders WHERE restaurantId = ?' + (status ? ' AND status = ?' : ''),
      status ? [restaurantId, status] : [restaurantId]
    );
    
    const total = countResult?.total || 0;
    
    return res.status(200).json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching restaurant orders:', error);
    next(error);
  }
};

/**
 * Update order status (for restaurant owners)
 * @route PATCH /api/orders/:id/status
 * @access Private (Restaurant Owner)
 */
exports.updateOrderStatus = async (req, res, next) => {
  const transaction = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { status, estimatedTime, restaurantNote } = req.body;
    const userId = req.user.id;
    
    const [order] = await transaction.query(
      `SELECT o.*, r.ownerId, r.name as restaurantName
       FROM orders o
       JOIN restaurants r ON o.restaurantId = r.id
       WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404));
    }

    // Check permissions - ensure user is restaurant owner, driver, or admin
    const isRestaurantOwner = order.ownerId === userId;
    const isAssignedDriver = order.driverId === userId;
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
    await transaction.query(
      'UPDATE orders SET status = ?, updatedAt = ?, restaurantNote = ? WHERE id = ?',
      [status, new Date(), restaurantNote, id]
    );

    // Update estimated delivery time based on status
    if (status === 'confirmed') {
      await transaction.query(
        'UPDATE orders SET estimatedDeliveryTime = ? WHERE id = ?',
        [estimatedTime || new Date(Date.now() + 45 * 60000), id]
      );
    } else if (status === 'preparing') {
      // Update prep start time
      await transaction.query(
        'UPDATE orders SET preparationStartTime = ? WHERE id = ?',
        [new Date(), id]
      );
    } else if (status === 'ready') {
      // Update prep end time
      await transaction.query(
        'UPDATE orders SET preparationEndTime = ? WHERE id = ?',
        [new Date(), id]
      );
    } else if (status === 'delivered') {
      await transaction.query(
        'UPDATE orders SET actualDeliveryTime = ? WHERE id = ?',
        [new Date(), id]
      );
    }

    // Log the status change
    const { OrderStatusLog } = require('../models');
    
    // Get geolocation data if available (primarily for drivers)
    let locationData = null;
    if (req.user.role === 'driver' && (status === 'out_for_delivery' || status === 'delivered')) {
      const { DriverLocation } = require('../models');
      const driverLocation = await DriverLocation.findOne({
        where: { driverId: userId }
      });
      
      if (driverLocation) {
        locationData = db.fn(
          'ST_GeomFromText', 
          `POINT(${driverLocation.longitude} ${driverLocation.latitude})`
        );
      }
    }
    
    // Create status log entry
    await OrderStatusLog.create({
      orderId: id,
      status,
      notes: restaurantNote || `Status changed from ${previousStatus} to ${status}`,
      changedById: userId,
      location: locationData,
      metadata: {
        previousStatus,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        changedBy: req.user.role
      }
    });

    // Commit transaction
    await transaction.commit();

    // Emit real-time updates
    emitToOrder(id, 'order_status_updated', {
      orderId: id,
      status,
      updatedAt: new Date().toISOString(),
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime
    });

    // Send notifications based on status
    switch (status) {
      case 'confirmed':
        emitToUser(order.userId, 'order_confirmed', {
          orderId: id,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
        break;
      case 'preparing':
        emitToUser(order.userId, 'order_preparing', {
          orderId: id,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
        break;
      case 'ready':
        if (order.driverId) {
          emitToUser(order.driverId, 'order_ready', {
            orderId: id,
            restaurantId: order.restaurantId
          });
        }
        emitToUser(order.userId, 'order_ready', {
          orderId: id
        });
        break;
      case 'out_for_delivery':
        emitToUser(order.userId, 'order_out_for_delivery', {
          orderId: id,
          driverId: order.driverId,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
        break;
      case 'delivered':
        emitToUser(order.userId, 'order_delivered', {
          orderId: id
        });
        break;
      case 'cancelled':
        emitToUser(order.userId, 'order_cancelled', {
          orderId: id,
          reason: restaurantNote
        });
        if (order.driverId) {
          emitToUser(order.driverId, 'order_cancelled', {
            orderId: id,
            reason: restaurantNote
          });
        }
        break;
    }

    res.status(200).json({
      status: 'success',
      data: {
        orderId: id,
        status
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
    const userId = req.user.id;

    // Find order
    const [order] = await db.query(
      `SELECT o.*, r.ownerId, r.name as restaurantName
       FROM orders o
       JOIN restaurants r ON o.restaurantId = r.id
       WHERE o.id = ? AND o.restaurant.userId = ?`,
      [id, userId]
    );

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is the restaurant owner
    if (order.restaurant.userId !== userId && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this order', 403));
    }

    // Check if driver exists
    const [driver] = await db.query(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [driverId, 'driver']
    );

    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    // Update order
    await db.query(
      'UPDATE orders SET driverId = ? WHERE id = ?',
      [driverId, id]
    );

    // Emit driver assignment event
    emitToOrder(id, 'driver_assigned', {
      orderId: id,
      driver: {
        id: driver.id,
        name: driver.fullName,
        phone: driver.phone,
        profileImage: driver.profileImage
      }
    });

    // Notify the driver
    emitToUser(driverId, 'new_order_assigned', {
      orderId: id,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurant.name,
      restaurantAddress: order.restaurant.address,
      deliveryAddress: order.deliveryAddress
    });

    res.status(200).json({
      status: 'success',
      data: {
        orderId: id,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 * @route GET /api/orders/stats
 * @access Private (Restaurant Owner)
 */
exports.getOrderStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // Verify permissions
    if (restaurantId) {
      const [restaurant] = await db.query(
        'SELECT * FROM restaurants WHERE id = ? AND ownerId = ?',
        [restaurantId, userId]
      );
      
      if (!restaurant && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these statistics'
        });
      }
    }
    
    // Build date filter
    let dateFilter = '';
    const params = [];
    
    if (restaurantId) {
      dateFilter = 'WHERE o.restaurantId = ?';
      params.push(restaurantId);
    } else if (req.user.role !== 'admin') {
      // If not admin and no restaurantId specified, return user's orders
      dateFilter = 'WHERE o.userId = ?';
      params.push(userId);
    } else {
      dateFilter = 'WHERE 1=1';
    }
    
    if (startDate) {
      dateFilter += ' AND o.createdAt >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      dateFilter += ' AND o.createdAt <= ?';
      params.push(endDate);
    }
    
    // Get overall stats
    const [totalStats] = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(totalAmount) as totalRevenue,
        AVG(totalAmount) as averageOrderValue
      FROM 
        orders o
      ${dateFilter}
    `, params);
    
    // Get stats by status
    const statusStats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM 
        orders o
      ${dateFilter}
      GROUP BY 
        status
    `, params);
    
    // Get daily order count for the last 30 days
    const dailyOrders = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        SUM(totalAmount) as revenue
      FROM 
        orders o
      ${dateFilter}
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY 
        DATE(createdAt)
      ORDER BY 
        date ASC
    `, params);
    
    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalOrders: totalStats.totalOrders || 0,
          totalRevenue: totalStats.totalRevenue || 0,
          averageOrderValue: totalStats.averageOrderValue || 0
        },
        byStatus: statusStats.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        dailyOrders
      }
    });
  } catch (error) {
    logger.error('Error fetching order statistics:', error);
    next(error);
  }
};