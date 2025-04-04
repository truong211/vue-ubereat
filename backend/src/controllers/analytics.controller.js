const db = require('../config/database');
const moment = require('moment');
const logger = require('../utils/logger');

// Get revenue analytics for a specific restaurant
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Define date filter clause
    let dateFilter = '';
    const params = [restaurantId];
    
    if (startDate && endDate) {
      dateFilter = 'AND createdAt BETWEEN ? AND ?';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Get total revenue, order count, and average order value
    const [revenueData] = await db.query(`
      SELECT 
        SUM(totalAmount) AS totalRevenue,
        COUNT(id) AS orderCount,
        AVG(totalAmount) AS averageOrderValue
      FROM orders
      WHERE restaurantId = ? 
        AND status = 'completed'
        ${dateFilter}
    `, params);
    
    // Get revenue by day for chart data
    const dailyRevenue = await db.query(`
      SELECT 
        DATE(createdAt) AS date,
        SUM(totalAmount) AS revenue
      FROM orders
      WHERE restaurantId = ? 
        AND status = 'completed'
        ${dateFilter}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, params);
    
    res.json({
      success: true,
      data: {
        summary: revenueData || { totalRevenue: 0, orderCount: 0, averageOrderValue: 0 },
        daily: dailyRevenue || []
      }
    });
  } catch (error) {
    logger.error('Error in getRevenueAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

// Get menu analytics for a specific restaurant
exports.getMenuAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Define date filter clause
    let dateFilter = '';
    const params = [restaurantId];
    
    if (startDate && endDate) {
      dateFilter = 'AND o.createdAt BETWEEN ? AND ?';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Get top-selling products
    const topProducts = await db.query(`
      SELECT 
        oi.productId,
        p.name,
        p.image AS image,
        SUM(oi.quantity) AS totalQuantity,
        SUM(oi.quantity * oi.price) AS totalRevenue
      FROM order_items oi
      JOIN orders o ON oi.orderId = o.id
      JOIN products p ON oi.productId = p.id
      WHERE o.restaurantId = ? 
        AND o.status = 'completed'
        ${dateFilter}
      GROUP BY oi.productId, p.name, p.image
      ORDER BY totalQuantity DESC
      LIMIT 10
    `, params);
    
    // Get category performance
    const categoryPerformance = await db.query(`
      SELECT 
        p.categoryId,
        c.name AS categoryName,
        SUM(oi.quantity) AS totalQuantity,
        SUM(oi.quantity * oi.price) AS totalRevenue
      FROM order_items oi
      JOIN orders o ON oi.orderId = o.id
      JOIN products p ON oi.productId = p.id
      JOIN categories c ON p.categoryId = c.id
      WHERE o.restaurantId = ? 
        AND o.status = 'completed'
        ${dateFilter}
      GROUP BY p.categoryId, c.name
      ORDER BY totalRevenue DESC
    `, params);
    
    res.json({
      success: true,
      data: {
        topProducts: topProducts.map(item => ({
          productId: item.productId,
          Product: {
            name: item.name,
            image: item.image
          },
          totalQuantity: item.totalQuantity,
          totalRevenue: item.totalRevenue
        })),
        categoryPerformance
      }
    });
  } catch (error) {
    logger.error('Error in getMenuAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu analytics',
      error: error.message
    });
  }
};

// Get customer analytics for a specific restaurant
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Define date filter clause
    let dateFilter = '';
    const params = [restaurantId];
    
    if (startDate && endDate) {
      dateFilter = 'AND createdAt BETWEEN ? AND ?';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Get customer metrics
    const [customerMetrics] = await db.query(`
      SELECT 
        COUNT(DISTINCT userId) AS uniqueCustomers,
        COUNT(id) / COUNT(DISTINCT userId) AS ordersPerCustomer,
        SUM(totalAmount) / COUNT(DISTINCT userId) AS averageCustomerValue
      FROM orders
      WHERE restaurantId = ? 
        AND status = 'completed'
        ${dateFilter}
    `, params);
    
    // Get top customers
    const topCustomers = await db.query(`
      SELECT 
        o.userId,
        u.fullName,
        u.email,
        COUNT(o.id) AS orderCount,
        SUM(o.totalAmount) AS totalSpent,
        MAX(o.createdAt) AS lastOrderDate
      FROM orders o
      JOIN users u ON o.userId = u.id
      WHERE o.restaurantId = ? 
        AND o.status = 'completed'
        ${dateFilter}
      GROUP BY o.userId, u.fullName, u.email
      ORDER BY totalSpent DESC
      LIMIT 10
    `, params);
    
    // Get new vs returning customers
    const customerRetention = await db.query(`
      SELECT 
        CASE 
          WHEN userOrderCount = 1 THEN 'New'
          ELSE 'Returning'
        END AS customerType,
        COUNT(*) AS customerCount
      FROM (
        SELECT 
          userId,
          COUNT(*) AS userOrderCount
        FROM orders
        WHERE restaurantId = ? 
          AND status = 'completed'
          ${dateFilter}
        GROUP BY userId
      ) AS userCounts
      GROUP BY customerType
    `, params);
    
    res.json({
      success: true,
      data: {
        metrics: customerMetrics || { uniqueCustomers: 0, ordersPerCustomer: 0, averageCustomerValue: 0 },
        topCustomers: topCustomers.map(customer => ({
          userId: customer.userId,
          User: {
            fullName: customer.fullName,
            email: customer.email
          },
          orderCount: customer.orderCount,
          totalSpent: customer.totalSpent,
          lastOrderDate: customer.lastOrderDate
        })),
        retention: customerRetention.reduce((acc, item) => {
          acc[item.customerType] = item.customerCount;
          return acc;
        }, { New: 0, Returning: 0 })
      }
    });
  } catch (error) {
    logger.error('Error in getCustomerAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics',
      error: error.message
    });
  }
};

// Get order analytics for a specific restaurant
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Define date filter clause
    let dateFilter = '';
    const params = [restaurantId];
    
    if (startDate && endDate) {
      dateFilter = 'AND createdAt BETWEEN ? AND ?';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Get order metrics
    const [orderMetrics] = await db.query(`
      SELECT 
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100 AS completionRate,
        AVG(TIMESTAMPDIFF(MINUTE, createdAt, updatedAt)) AS avgFulfillmentTime
      FROM orders
      WHERE restaurantId = ? 
        ${dateFilter}
    `, params);
    
    // Get order status breakdown
    const orderStatuses = await db.query(`
      SELECT 
        status,
        COUNT(*) AS count
      FROM orders
      WHERE restaurantId = ? 
        ${dateFilter}
      GROUP BY status
    `, params);
    
    // Get order counts by hour
    const hourlyOrders = await db.query(`
      SELECT 
        HOUR(createdAt) AS hour,
        COUNT(*) AS count
      FROM orders
      WHERE restaurantId = ? 
        ${dateFilter}
      GROUP BY HOUR(createdAt)
      ORDER BY hour ASC
    `, params);
    
    // Get order counts by day of week
    const dowOrders = await db.query(`
      SELECT 
        DAYOFWEEK(createdAt) AS dayOfWeek,
        COUNT(*) AS count
      FROM orders
      WHERE restaurantId = ? 
        ${dateFilter}
      GROUP BY DAYOFWEEK(createdAt)
      ORDER BY dayOfWeek ASC
    `, params);
    
    res.json({
      success: true,
      data: {
        metrics: orderMetrics || { totalOrders: 0, completionRate: 0, avgFulfillmentTime: 0 },
        statuses: orderStatuses.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        hourly: hourlyOrders,
        dayOfWeek: dowOrders
      }
    });
  } catch (error) {
    logger.error('Error in getOrderAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics',
      error: error.message
    });
  }
};

// Get overview dashboard for a restaurant
exports.getDashboardOverview = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Get today's date range
    const today = moment().format('YYYY-MM-DD');
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    
    // Get today's summary
    const [todaySummary] = await db.query(`
      SELECT 
        COUNT(*) AS orderCount,
        SUM(totalAmount) AS revenue,
        COUNT(DISTINCT userId) AS customers
      FROM orders
      WHERE restaurantId = ? 
        AND createdAt BETWEEN ? AND ?
    `, [restaurantId, todayStart, todayEnd]);
    
    // Get pending orders count
    const [pendingOrders] = await db.query(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE restaurantId = ? 
        AND status IN ('pending', 'preparing')
    `, [restaurantId]);
    
    // Get revenue for last 7 days
    const last7Days = await db.query(`
      SELECT 
        DATE(createdAt) AS date,
        SUM(totalAmount) AS revenue,
        COUNT(*) AS orderCount
      FROM orders
      WHERE restaurantId = ? 
        AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status = 'completed'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, [restaurantId]);
    
    // Get top selling products for today
    const topProducts = await db.query(`
      SELECT 
        p.name,
        SUM(oi.quantity) AS quantity
      FROM order_items oi
      JOIN orders o ON oi.orderId = o.id
      JOIN products p ON oi.productId = p.id
      WHERE o.restaurantId = ? 
        AND o.createdAt BETWEEN ? AND ?
      GROUP BY p.name
      ORDER BY quantity DESC
      LIMIT 5
    `, [restaurantId, todayStart, todayEnd]);
    
    res.json({
      success: true,
      data: {
        today: {
          orders: todaySummary.orderCount || 0,
          revenue: todaySummary.revenue || 0,
          customers: todaySummary.customers || 0,
          pendingOrders: pendingOrders.count || 0
        },
        last7Days,
        topProducts
      }
    });
  } catch (error) {
    logger.error('Error in getDashboardOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message
    });
  }
};