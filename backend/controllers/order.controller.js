const db = require('../config/database');

/**
 * Get all orders for current user
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE o.userId = ?';
    const queryParams = [userId];

    if (status) {
      whereClause += ' AND o.status = ?';
      queryParams.push(status);
    }

    if (startDate) {
      whereClause += ' AND DATE(o.createdAt) >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(o.createdAt) <= ?';
      queryParams.push(endDate);
    }

    // Get orders with restaurant information
    const orders = await db.query(
      `SELECT 
        o.*,
        r.name as restaurantName,
        r.logo as restaurantLogo,
        r.phone as restaurantPhone
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurantId = r.id
      ${whereClause}
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Get order items for each order
    for (let order of orders) {
      const items = await db.query(
        `SELECT oi.*, p.image as productImage
         FROM order_items oi
         LEFT JOIN products p ON oi.productId = p.id
         WHERE oi.orderId = ?`,
        [order.id]
      );
      order.items = items;
    }

    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Get single order details
 */
const getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    // Get order with restaurant information
    const orders = await db.query(
      `SELECT 
        o.*,
        r.name as restaurantName,
        r.logo as restaurantLogo,
        r.phone as restaurantPhone,
        r.address as restaurantAddress
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurantId = r.id
      WHERE o.id = ? AND o.userId = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    const order = orders[0];

    // Get order items
    const items = await db.query(
      `SELECT oi.*, p.image as productImage
       FROM order_items oi
       LEFT JOIN products p ON oi.productId = p.id
       WHERE oi.orderId = ?`,
      [orderId]
    );
    order.items = items;

    // Get order status logs
    const statusLogs = await db.query(
      `SELECT osl.*, u.fullName as updatedByName
       FROM order_status_logs osl
       LEFT JOIN users u ON osl.userId = u.id
       WHERE osl.orderId = ?
       ORDER BY osl.createdAt ASC`,
      [orderId]
    );
    order.statusLogs = statusLogs;

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Get order statistics for current user
 */
const getOrderStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total orders
    const totalOrdersResult = await db.query(
      'SELECT COUNT(*) as total FROM orders WHERE userId = ?',
      [userId]
    );
    const totalOrders = totalOrdersResult[0].total;

    // Get orders by status
    const statusStats = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       WHERE userId = ? 
       GROUP BY status`,
      [userId]
    );

    // Get total spent
    const totalSpentResult = await db.query(
      `SELECT SUM(totalAmount) as total 
       FROM orders 
       WHERE userId = ? AND status IN ('delivered', 'completed')`,
      [userId]
    );
    const totalSpent = totalSpentResult[0].total || 0;

    // Get favorite restaurants
    const favoriteRestaurants = await db.query(
      `SELECT 
        r.id, r.name, r.logo, COUNT(*) as orderCount
       FROM orders o
       JOIN restaurants r ON o.restaurantId = r.id
       WHERE o.userId = ?
       GROUP BY r.id, r.name, r.logo
       ORDER BY orderCount DESC
       LIMIT 5`,
      [userId]
    );

    // Get monthly order trends (last 6 months)
    const monthlyTrends = await db.query(
      `SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as orderCount,
        SUM(totalAmount) as totalAmount
       FROM orders 
       WHERE userId = ? 
         AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
       ORDER BY month ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalOrders,
        totalSpent,
        statusStats,
        favoriteRestaurants,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

module.exports = {
  getUserOrders,
  getOrder,
  getOrderStatistics
};