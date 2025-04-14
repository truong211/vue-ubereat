const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// Get user orders with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 5, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      userId: req.user.id
    };

    if (status === 'active') {
      where.status = {
        [Op.in]: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery']
      };
    } else if (status) {
      where.status = status;
    }

    const orders = await db.Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: db.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: db.OrderItem,
          as: 'orderItems',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders: orders.rows,
      total: orders.count,
      page: parseInt(page),
      totalPages: Math.ceil(orders.count / limit)
    });
  } catch (err) {
    console.error('Error getting orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await db.Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: db.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: db.OrderItem,
          as: 'orderItems',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error getting order:', err);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const order = await db.Order.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending'
    });

    // Create order items
    if (req.body.items && Array.isArray(req.body.items)) {
      await Promise.all(req.body.items.map(item =>
        db.OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })
      ));
    }

    const fullOrder = await db.Order.findByPk(order.id, {
      include: [
        {
          model: db.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: db.OrderItem,
          as: 'orderItems',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });

    res.status(201).json(fullOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// Cancel order
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await db.Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    await order.update({
      status: 'cancelled',
      cancellationReason: req.body.reason
    });

    res.json(order);
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

// Add review to order
router.post('/:id/review', auth, async (req, res) => {
  try {
    const order = await db.Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: 'delivered'
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or cannot be reviewed' });
    }

    const review = await db.Review.create({
      orderId: order.id,
      userId: req.user.id,
      restaurantId: order.restaurantId,
      rating: req.body.rating,
      comment: req.body.comment
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ message: 'Error adding review' });
  }
});

module.exports = router;
