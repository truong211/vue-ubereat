const { Order, OrderDetail, Product, Restaurant, User, Review, Driver } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } = require('date-fns');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const { format } = require('date-fns');
const fs = require('fs');
const path = require('path');

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    default:
      throw new Error('Invalid period');
  }
  
  return { start, end: now };
};

/**
 * Get revenue analytics
 * @route GET /api/analytics/revenue/:restaurantId
 * @access Private (Restaurant Owner)
 */
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { timeRange = 'week', startDate, endDate } = req.query;

    // Check authorization
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant || (restaurant.userId !== req.user.id && req.user.role !== 'admin')) {
      return next(new AppError('Không có quyền xem báo cáo của nhà hàng này', 403));
    }

    // Calculate date range
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      const now = new Date();
      switch (timeRange) {
        case 'day':
          dateRange = {
            start: startOfDay(now),
            end: endOfDay(now)
          };
          break;
        case 'week':
          dateRange = {
            start: startOfWeek(now),
            end: endOfWeek(now)
          };
          break;
        case 'month':
          dateRange = {
            start: startOfMonth(now),
            end: endOfMonth(now)
          };
          break;
        default:
          dateRange = {
            start: startOfWeek(now),
            end: endOfWeek(now)
          };
      }
    }

    // Get revenue summary
    const [currentPeriod, previousPeriod] = await Promise.all([
      Order.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgOrderValue'],
          [
            sequelize.literal(`
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*)
            `),
            'cancelRate'
          ]
        ],
        where: {
          restaurantId,
          createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
        },
        raw: true
      }),
      Order.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgOrderValue'],
          [
            sequelize.literal(`
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*)
            `),
            'cancelRate'
          ]
        ],
        where: {
          restaurantId,
          createdAt: {
            [Op.between]: [
              new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
              dateRange.start
            ]
          }
        },
        raw: true
      })
    ]);

    // Calculate trends
    const trends = {
      revenueTrend: calculateTrend(
        currentPeriod[0].totalRevenue,
        previousPeriod[0].totalRevenue
      ),
      ordersTrend: calculateTrend(
        currentPeriod[0].totalOrders,
        previousPeriod[0].totalOrders
      ),
      avgOrderTrend: calculateTrend(
        currentPeriod[0].avgOrderValue,
        previousPeriod[0].avgOrderValue
      ),
      cancelRateTrend: calculateTrend(
        currentPeriod[0].cancelRate,
        previousPeriod[0].cancelRate
      )
    };

    // Get revenue by time period
    const timeSeriesData = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        restaurantId,
        createdAt: { [Op.between]: [dateRange.start, dateRange.end] },
        status: { [Op.not]: 'cancelled' }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Get top selling items
    const topItems = await OrderDetail.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            restaurantId,
            createdAt: { [Op.between]: [dateRange.start, dateRange.end] },
            status: { [Op.not]: 'cancelled' }
          }
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'image']
        }
      ],
      group: ['productId', 'product.id', 'product.name', 'product.image'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Get customer metrics
    const customerMetrics = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT userId')), 'totalCustomers'],
        [
          sequelize.literal(`
            COUNT(DISTINCT CASE 
              WHEN userId IN (
                SELECT userId FROM orders o2 
                WHERE o2.restaurantId = orders.restaurantId 
                AND o2.createdAt < orders.createdAt
              ) THEN userId 
            END)
          `),
          'returningCustomers'
        ]
      ],
      where: {
        restaurantId,
        createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
      },
      raw: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          revenue: parseFloat(currentPeriod[0].totalRevenue) || 0,
          orders: parseInt(currentPeriod[0].totalOrders) || 0,
          avgOrderValue: parseFloat(currentPeriod[0].avgOrderValue) || 0,
          cancelRate: parseFloat(currentPeriod[0].cancelRate) || 0,
          ...trends
        },
        timeSeriesData,
        topItems: topItems.map(item => ({
          id: item.productId,
          name: item['product.name'],
          image: item['product.image'],
          quantity: parseInt(item.totalQuantity),
          revenue: parseFloat(item.totalRevenue)
        })),
        customerMetrics: {
          totalCustomers: parseInt(customerMetrics[0].totalCustomers) || 0,
          returningCustomers: parseInt(customerMetrics[0].returningCustomers) || 0,
          newCustomers: parseInt(customerMetrics[0].totalCustomers - customerMetrics[0].returningCustomers) || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get menu item analytics
 * @route GET /api/analytics/menu/:restaurantId
 * @access Private (Restaurant Owner)
 */
exports.getMenuAnalytics = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { period = 'month', limit = 10 } = req.query;

    // Check authorization
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant || (restaurant.userId !== req.user.id && req.user.role !== 'admin')) {
      return next(new AppError('Không có quyền xem báo cáo của nhà hàng này', 403));
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = subMonths(endDate, period === 'year' ? 12 : 1);

    // Get item performance data
    const itemPerformance = await OrderDetail.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('subtotal')), 'avgRevenue']
      ],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            restaurantId,
            createdAt: { [Op.between]: [startDate, endDate] },
            status: { [Op.not]: 'cancelled' }
          }
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'image', 'price', 'category']
        }
      ],
      group: ['productId', 'product.id', 'product.name', 'product.image', 'product.price', 'product.category'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    // Get category performance
    const categoryPerformance = await OrderDetail.findAll({
      attributes: [
        [sequelize.col('product.category'), 'category'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            restaurantId,
            createdAt: { [Op.between]: [startDate, endDate] },
            status: { [Op.not]: 'cancelled' }
          }
        },
        {
          model: Product,
          as: 'product',
          attributes: []
        }
      ],
      group: [sequelize.col('product.category')],
      order: [[sequelize.fn('SUM', sequelize.col('subtotal')), 'DESC']],
      raw: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        items: itemPerformance.map(item => ({
          id: item.productId,
          name: item['product.name'],
          image: item['product.image'],
          category: item['product.category'],
          price: parseFloat(item['product.price']),
          totalOrders: parseInt(item.totalOrders),
          totalRevenue: parseFloat(item.totalRevenue),
          avgRevenue: parseFloat(item.avgRevenue)
        })),
        categories: categoryPerformance.map(cat => ({
          name: cat.category,
          totalOrders: parseInt(cat.totalOrders),
          totalRevenue: parseFloat(cat.totalRevenue),
          percentage: 0 // Will be calculated on frontend
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer analytics
 * @route GET /api/analytics/customers/:restaurantId
 * @access Private (Restaurant Owner)
 */
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { period = 'month' } = req.query;

    // Check authorization
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant || (restaurant.userId !== req.user.id && req.user.role !== 'admin')) {
      return next(new AppError('Không có quyền xem báo cáo của nhà hàng này', 403));
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = subMonths(endDate, period === 'year' ? 12 : 1);

    // Get customer metrics
    const [customerMetrics, customerRetention, avgOrderValue] = await Promise.all([
      // Total and new customers
      Order.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.literal('DISTINCT userId')), 'totalCustomers'],
          [
            sequelize.literal(`
              COUNT(DISTINCT CASE 
                WHEN userId NOT IN (
                  SELECT userId FROM orders o2 
                  WHERE o2.restaurantId = orders.restaurantId 
                  AND o2.createdAt < orders.createdAt
                ) THEN userId 
              END)
            `),
            'newCustomers'
          ]
        ],
        where: {
          restaurantId,
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        raw: true
      }),

      // Customer retention rate
      Order.findAll({
        attributes: [
          [
            sequelize.literal(`
              COUNT(DISTINCT CASE 
                WHEN userId IN (
                  SELECT userId FROM orders o2 
                  WHERE o2.restaurantId = orders.restaurantId 
                  AND o2.createdAt < orders.createdAt
                ) THEN userId 
              END) * 100.0 / COUNT(DISTINCT userId)
            `),
            'retentionRate'
          ]
        ],
        where: {
          restaurantId,
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        raw: true
      }),

      // Average order value per customer
      Order.findAll({
        attributes: [
          'userId',
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgOrderValue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
        ],
        where: {
          restaurantId,
          createdAt: { [Op.between]: [startDate, endDate] },
          status: { [Op.not]: 'cancelled' }
        },
        group: ['userId'],
        raw: true
      })
    ]);

    // Calculate average customer lifetime value
    const customerLTV = avgOrderValue.reduce((sum, customer) => {
      return sum + (parseFloat(customer.avgOrderValue) * parseInt(customer.orderCount));
    }, 0) / avgOrderValue.length;

    res.status(200).json({
      status: 'success',
      data: {
        totalCustomers: parseInt(customerMetrics[0].totalCustomers) || 0,
        newCustomers: parseInt(customerMetrics[0].newCustomers) || 0,
        returningCustomers: parseInt(customerMetrics[0].totalCustomers - customerMetrics[0].newCustomers) || 0,
        retentionRate: parseFloat(customerRetention[0].retentionRate) || 0,
        averageOrderValue: avgOrderValue.length > 0
          ? avgOrderValue.reduce((sum, c) => sum + parseFloat(c.avgOrderValue), 0) / avgOrderValue.length
          : 0,
        customerLTV: customerLTV || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const orders = await Order.findAll({
      where: {
        restaurantId,
        status: 'completed',
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('sum', sequelize.col('totalAmount')), 'revenue']
      ],
      group: [sequelize.fn('date', sequelize.col('createdAt'))]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({ error: 'Failed to get revenue statistics' });
  }
};

exports.getPopularItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 10 } = req.query;

    const popularItems = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity']
      ],
      include: [{
        model: MenuItem,
        where: { restaurantId },
        attributes: ['name', 'price']
      }],
      group: ['menuItemId', 'MenuItem.id'],
      order: [[sequelize.fn('sum', sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit)
    });

    res.json(popularItems);
  } catch (error) {
    console.error('Error getting popular items:', error);
    res.status(500).json({ error: 'Failed to get popular items' });
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const orderStats = await Order.findAll({
      where: {
        restaurantId,
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        'status',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json(orderStats);
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({ error: 'Failed to get order statistics' });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const customerStats = await Order.findAll({
      where: {
        restaurantId,
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      include: [{
        model: User,
        attributes: ['id']
      }],
      attributes: [
        [sequelize.fn('count', sequelize.col('userId')), 'orderCount'],
        [sequelize.fn('count', sequelize.fn('distinct', sequelize.col('userId'))), 'uniqueCustomers'],
        [sequelize.fn('avg', sequelize.col('totalAmount')), 'averageOrderValue']
      ]
    });

    res.json(customerStats[0]);
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    res.status(500).json({ error: 'Failed to get customer analytics' });
  }
};

// Helper function to calculate trend percentage
const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get comprehensive analytics data
 * @route GET /api/analytics
 * @access Private (Admin)
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const endDate = new Date();
    let startDate;

    // Calculate start date based on period
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get previous period for growth calculations
    const previousStartDate = new Date(startDate);
    const periodDiff = endDate.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodDiff);

    // Gather all analytics data in parallel
    const [
      currentStats,
      previousStats,
      topRestaurants,
      topDrivers,
      orderTrends,
      userStats
    ] = await Promise.all([
      // Current period stats
      Order.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('restaurantId'))), 'activeRestaurants']
        ],
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          status: { [Op.not]: 'cancelled' }
        },
        raw: true
      }),

      // Previous period stats for growth calculation
      Order.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('restaurantId'))), 'activeRestaurants']
        ],
        where: {
          createdAt: { [Op.between]: [previousStartDate, startDate] },
          status: { [Op.not]: 'cancelled' }
        },
        raw: true
      }),

      // Top performing restaurants
      Restaurant.findAll({
        attributes: [
          'id',
          'name',
          'logo',
          'rating',
          [sequelize.fn('COUNT', sequelize.col('Orders.id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('Orders.totalAmount')), 'revenue']
        ],
        include: [{
          model: Order,
          attributes: [],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] },
            status: { [Op.not]: 'cancelled' }
          }
        }],
        group: ['Restaurant.id'],
        order: [[sequelize.fn('SUM', sequelize.col('Orders.totalAmount')), 'DESC']],
        limit: 10,
        raw: true
      }),

      // Top performing drivers
      Driver.findAll({
        attributes: [
          'id',
          'name',
          'avatar',
          'rating',
          [sequelize.fn('COUNT', sequelize.col('Orders.id')), 'deliveryCount'],
          [sequelize.fn('AVG', sequelize.col('Orders.deliveryTime')), 'avgDeliveryTime'],
          [sequelize.literal('(COUNT(CASE WHEN Orders.deliveredOnTime = true THEN 1 END) * 100.0 / COUNT(*))'), 'onTimeRate']
        ],
        include: [{
          model: Order,
          attributes: [],
          where: {
            createdAt: { [Op.between]: [startDate, endDate] },
            status: 'delivered'
          }
        }],
        group: ['Driver.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Orders.id')), 'DESC']],
        limit: 10,
        raw: true
      }),

      // Order trends over time
      Order.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
        ],
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          status: { [Op.not]: 'cancelled' }
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true
      }),

      // User statistics
      User.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
          [sequelize.literal('COUNT(CASE WHEN role = \'customer\' THEN 1 END)'), 'customers'],
          [sequelize.literal('COUNT(CASE WHEN role = \'restaurant\' THEN 1 END)'), 'restaurants'],
          [sequelize.literal('COUNT(CASE WHEN role = \'driver\' THEN 1 END)'), 'drivers']
        ],
        raw: true
      })
    ]);

    // Calculate growth rates
    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    // Format response data
    const stats = {
      orders: currentStats[0].orderCount || 0,
      ordersGrowth: calculateGrowth(
        currentStats[0].orderCount,
        previousStats[0].orderCount
      ),
      revenue: currentStats[0].revenue || 0,
      revenueGrowth: calculateGrowth(
        currentStats[0].revenue,
        previousStats[0].revenue
      ),
      restaurants: currentStats[0].activeRestaurants || 0,
      restaurantsGrowth: calculateGrowth(
        currentStats[0].activeRestaurants,
        previousStats[0].activeRestaurants
      ),
      users: userStats[0].totalUsers || 0,
      usersGrowth: calculateGrowth(
        currentStats[0].uniqueUsers,
        previousStats[0].uniqueUsers
      )
    };

    // Transform order trends data
    const trends = orderTrends.map(trend => ({
      date: trend.date,
      orders: parseInt(trend.orderCount),
      revenue: parseFloat(trend.revenue)
    }));

    // Transform user segments data
    const userSegments = [
      { name: 'Customers', value: parseInt(userStats[0].customers) },
      { name: 'Restaurant Owners', value: parseInt(userStats[0].restaurants) },
      { name: 'Drivers', value: parseInt(userStats[0].drivers) }
    ];

    // Transform restaurant data
    const restaurants = topRestaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      logo: restaurant.logo,
      orders: parseInt(restaurant.orderCount),
      revenue: parseFloat(restaurant.revenue),
      rating: parseFloat(restaurant.rating),
      growth: 0 // Would need additional query for accurate growth calculation
    }));

    // Transform driver data
    const drivers = topDrivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      avatar: driver.avatar,
      deliveries: parseInt(driver.deliveryCount),
      onTimeRate: parseFloat(driver.onTimeRate).toFixed(1),
      avgDeliveryTime: parseInt(driver.avgDeliveryTime),
      rating: parseFloat(driver.rating)
    }));

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        trends,
        userSegments,
        restaurants,
        drivers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export analytics report
 * @route POST /api/analytics/export
 * @access Private (Admin)
 */
exports.exportAnalytics = async (req, res, next) => {
  try {
    const { format = 'excel', sections = ['overview'], period = 'month' } = req.body;

    // Get analytics data
    const { data } = await exports.getAnalytics({ query: { period } }, { json: () => {} }, next);

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    let filepath;

    switch (format) {
      case 'excel':
        filepath = await generateExcelReport(data, sections, timestamp, reportsDir);
        break;
      case 'pdf':
        filepath = await generatePDFReport(data, sections, timestamp, reportsDir);
        break;
      case 'csv':
        filepath = await generateCSVReport(data, sections, timestamp, reportsDir);
        break;
      default:
        throw new Error('Unsupported export format');
    }

    res.download(filepath, path.basename(filepath), (err) => {
      if (err) {
        next(err);
      } else {
        // Clean up file after sending
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate Excel report
async function generateExcelReport(data, sections, timestamp, reportsDir) {
  const workbook = new ExcelJS.Workbook();
  
  if (sections.includes('overview')) {
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Metric', key: 'metric' },
      { header: 'Value', key: 'value' },
      { header: 'Growth', key: 'growth' }
    ];

    overviewSheet.addRows([
      { metric: 'Total Orders', value: data.stats.orders, growth: `${data.stats.ordersGrowth}%` },
      { metric: 'Total Revenue', value: data.stats.revenue, growth: `${data.stats.revenueGrowth}%` },
      { metric: 'Active Restaurants', value: data.stats.restaurants, growth: `${data.stats.restaurantsGrowth}%` },
      { metric: 'Active Users', value: data.stats.users, growth: `${data.stats.usersGrowth}%` }
    ]);
  }

  if (sections.includes('restaurants')) {
    const restaurantsSheet = workbook.addWorksheet('Restaurant Performance');
    restaurantsSheet.columns = [
      { header: 'Restaurant', key: 'name' },
      { header: 'Orders', key: 'orders' },
      { header: 'Revenue', key: 'revenue' },
      { header: 'Rating', key: 'rating' },
      { header: 'Growth', key: 'growth' }
    ];
    restaurantsSheet.addRows(data.restaurants);
  }

  if (sections.includes('drivers')) {
    const driversSheet = workbook.addWorksheet('Driver Performance');
    driversSheet.columns = [
      { header: 'Driver', key: 'name' },
      { header: 'Deliveries', key: 'deliveries' },
      { header: 'On-Time Rate', key: 'onTimeRate' },
      { header: 'Avg Delivery Time', key: 'avgDeliveryTime' },
      { header: 'Rating', key: 'rating' }
    ];
    driversSheet.addRows(data.drivers);
  }

  const filepath = path.join(reportsDir, `analytics-report-${timestamp}.xlsx`);
  await workbook.xlsx.writeFile(filepath);
  return filepath;
}

// Helper function to generate PDF report
async function generatePDFReport(data, sections, timestamp, reportsDir) {
  const doc = new PDFDocument();
  const filepath = path.join(reportsDir, `analytics-report-${timestamp}.pdf`);
  const stream = fs.createWriteStream(filepath);

  doc.pipe(stream);

  // Add title
  doc.fontSize(20).text('Analytics Report', { align: 'center' });
  doc.moveDown();

  if (sections.includes('overview')) {
    doc.fontSize(16).text('Overview');
    doc.moveDown();

    const overviewTable = {
      headers: ['Metric', 'Value', 'Growth'],
      rows: [
        ['Total Orders', data.stats.orders.toString(), `${data.stats.ordersGrowth}%`],
        ['Total Revenue', `$${data.stats.revenue.toFixed(2)}`, `${data.stats.revenueGrowth}%`],
        ['Active Restaurants', data.stats.restaurants.toString(), `${data.stats.restaurantsGrowth}%`],
        ['Active Users', data.stats.users.toString(), `${data.stats.usersGrowth}%`]
      ]
    };
    
    await doc.table(overviewTable, { width: 500 });
  }

  if (sections.includes('restaurants')) {
    doc.addPage();
    doc.fontSize(16).text('Restaurant Performance');
    doc.moveDown();

    const restaurantTable = {
      headers: ['Restaurant', 'Orders', 'Revenue', 'Rating'],
      rows: data.restaurants.map(r => [
        r.name,
        r.orders.toString(),
        `$${r.revenue.toFixed(2)}`,
        r.rating.toString()
      ])
    };
    
    await doc.table(restaurantTable, { width: 500 });
  }

  if (sections.includes('drivers')) {
    doc.addPage();
    doc.fontSize(16).text('Driver Performance');
    doc.moveDown();

    const driverTable = {
      headers: ['Driver', 'Deliveries', 'On-Time Rate', 'Avg Time', 'Rating'],
      rows: data.drivers.map(d => [
        d.name,
        d.deliveries.toString(),
        `${d.onTimeRate}%`,
        `${d.avgDeliveryTime}m`,
        d.rating.toString()
      ])
    };
    
    await doc.table(driverTable, { width: 500 });
  }

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      resolve(filepath);
    });
  });
}

// Helper function to generate CSV report
async function generateCSVReport(data, sections, timestamp, reportsDir) {
  const filepath = path.join(reportsDir, `analytics-report-${timestamp}.csv`);
  const output = [];

  if (sections.includes('overview')) {
    output.push('Overview');
    output.push('Metric,Value,Growth');
    output.push(`Total Orders,${data.stats.orders},${data.stats.ordersGrowth}%`);
    output.push(`Total Revenue,${data.stats.revenue},${data.stats.revenueGrowth}%`);
    output.push(`Active Restaurants,${data.stats.restaurants},${data.stats.restaurantsGrowth}%`);
    output.push(`Active Users,${data.stats.users},${data.stats.usersGrowth}%`);
    output.push('');
  }

  if (sections.includes('restaurants')) {
    output.push('Restaurant Performance');
    output.push('Restaurant,Orders,Revenue,Rating,Growth');
    data.restaurants.forEach(r => {
      output.push(`"${r.name}",${r.orders},${r.revenue},${r.rating},${r.growth}%`);
    });
    output.push('');
  }

  if (sections.includes('drivers')) {
    output.push('Driver Performance');
    output.push('Driver,Deliveries,On-Time Rate,Avg Delivery Time,Rating');
    data.drivers.forEach(d => {
      output.push(`"${d.name}",${d.deliveries},${d.onTimeRate}%,${d.avgDeliveryTime},${d.rating}`);
    });
  }

  await fs.promises.writeFile(filepath, output.join('\n'));
  return filepath;
}