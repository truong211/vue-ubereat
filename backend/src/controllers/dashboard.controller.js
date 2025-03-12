const { Order, OrderDetail, Product, Restaurant, User, Review } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * Get restaurant dashboard statistics
 * @route GET /api/dashboard/restaurant/:restaurantId
 * @access Private (Restaurant Owner)
 */
exports.getRestaurantStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { period = 'week' } = req.query;

    // Check if user is the restaurant owner
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to view these statistics', 403));
    }

    // Set date range based on period
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'day':
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
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get order statistics
    const orderStats = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      where: {
        restaurantId,
        createdAt: { [Op.between]: [startDate, endDate] },
        status: { [Op.not]: 'cancelled' }
      },
      raw: true
    });

    // Get order count by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        restaurantId,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: ['status'],
      raw: true
    });

    // Get top selling products
    const topProducts = await OrderDetail.findAll({
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
            createdAt: { [Op.between]: [startDate, endDate] },
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
      limit: 5,
      raw: true
    });

    // Get sales by day for the period
    const salesByDay = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        restaurantId,
        createdAt: { [Op.between]: [startDate, endDate] },
        status: { [Op.not]: 'cancelled' }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Get recent reviews
    const recentReviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image'],
          where: { restaurantId }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Format response data
    const stats = {
      totalOrders: parseInt(orderStats[0].totalOrders) || 0,
      totalRevenue: parseFloat(orderStats[0].totalRevenue) || 0,
      averageOrderValue: parseFloat(orderStats[0].averageOrderValue) || 0,
      ordersByStatus,
      topProducts,
      salesByDay,
      recentReviews
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer order statistics
 * @route GET /api/dashboard/customer
 * @access Private
 */
exports.getCustomerStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get order statistics
    const orderStats = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      where: {
        userId,
        status: { [Op.not]: 'cancelled' }
      },
      raw: true
    });

    // Get order count by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        userId
      },
      group: ['status'],
      raw: true
    });

    // Get favorite restaurants (most ordered from)
    const favoriteRestaurants = await Order.findAll({
      attributes: [
        'restaurantId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name', 'logo', 'cuisineType']
        }
      ],
      where: {
        userId,
        status: { [Op.not]: 'cancelled' }
      },
      group: ['restaurantId', 'restaurant.id', 'restaurant.name', 'restaurant.logo', 'restaurant.cuisineType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 3,
      raw: true
    });

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: {
        userId
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Format response data
    const stats = {
      totalOrders: parseInt(orderStats[0].totalOrders) || 0,
      totalSpent: parseFloat(orderStats[0].totalSpent) || 0,
      averageOrderValue: parseFloat(orderStats[0].averageOrderValue) || 0,
      ordersByStatus,
      favoriteRestaurants,
      recentOrders
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard statistics
 * @route GET /api/dashboard/admin
 * @access Private (Admin)
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to view these statistics', 403));
    }

    const { period = 'week' } = req.query;

    // Set date range based on period
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'day':
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
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get platform statistics
    const platformStats = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
      ],
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        status: { [Op.not]: 'cancelled' }
      },
      raw: true
    });

    // Get user statistics
    const userStats = await User.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = "customer" THEN 1 END')), 'customers'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = "restaurant" THEN 1 END')), 'restaurants'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN role = "driver" THEN 1 END')), 'drivers']
      ],
      raw: true
    });

    // Get new users by day
    const newUsersByDay = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Get top restaurants by order count
    const topRestaurants = await Order.findAll({
      attributes: [
        'restaurantId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name', 'logo', 'cuisineType']
        }
      ],
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        status: { [Op.not]: 'cancelled' }
      },
      group: ['restaurantId', 'restaurant.id', 'restaurant.name', 'restaurant.logo', 'restaurant.cuisineType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    // Format response data
    const stats = {
      totalOrders: parseInt(platformStats[0].totalOrders) || 0,
      totalRevenue: parseFloat(platformStats[0].totalRevenue) || 0,
      averageOrderValue: parseFloat(platformStats[0].averageOrderValue) || 0,
      totalUsers: parseInt(userStats[0].totalUsers) || 0,
      customers: parseInt(userStats[0].customers) || 0,
      restaurants: parseInt(userStats[0].restaurants) || 0,
      drivers: parseInt(userStats[0].drivers) || 0,
      newUsersByDay,
      topRestaurants
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};