const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const db = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes

// Protected routes
router.use(authMiddleware);

// Customer routes
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 5, status } = req.query;
    const offset = (page - 1) * parseInt(limit);

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
          attributes: ['id', 'name', 'logo'],
          required: false
        },
        {
          model: db.OrderItem,
          as: 'orderItems',
          required: false,
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'price'],
              required: false
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!orders) {
      return res.status(404).json({ 
        success: false,
        message: 'No orders found' 
      });
    }

    return res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        page: parseInt(page),
        totalPages: Math.ceil(orders.count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Error getting orders:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get('/:id', orderController.getOrderDetails);

router.post('/', [
  body('paymentMethod')
    .isIn(['cash', 'card', 'momo', 'zalopay'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
  body('deliveryInstructions')
    .optional()
    .isString()
    .withMessage('Ghi chú giao hàng không hợp lệ')
], orderController.createOrder);

router.patch('/:id/cancel', [
  body('cancellationReason')
    .notEmpty()
    .withMessage('Vui lòng cung cấp lý do hủy đơn')
], orderController.cancelOrder);

// Restaurant owner routes
router.get('/restaurant/:restaurantId', 
  restrictTo('restaurant', 'admin'),
  orderController.getRestaurantOrders
);

router.patch('/:id/status',
  restrictTo('restaurant', 'admin'),
  [
    body('status')
      .isIn(['preparing', 'ready', 'completed', 'cancelled'])
      .withMessage('Trạng thái đơn hàng không hợp lệ'),
    body('note')
      .optional()
      .isString()
      .withMessage('Ghi chú không hợp lệ')
  ],
  orderController.updateOrderStatus
);

router.patch('/:id/assign-driver',
  restrictTo('restaurant', 'admin'),
  [
    body('driverId')
      .isInt()
      .withMessage('ID tài xế không hợp lệ')
  ],
  orderController.assignDriver
);

module.exports = router;