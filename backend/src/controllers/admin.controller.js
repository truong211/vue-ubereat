const { Restaurant, User, Order, Category, Promotion, Product, Banner } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { StaticPage, SiteConfig } = require('../models')
const multer = require('multer')
const path = require('path')
const os = require('os');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.originalUrl.includes('categories') ? 'categories' : 'banners'
    cb(null, `uploads/${type}`)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only images are allowed'))
  }
}).single('image')

// Dashboard Statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalRestaurants,
      pendingRestaurants
    ] = await Promise.all([
      Order.count(),
      Order.sum('total'),
      User.count(),
      Restaurant.count(),
      Restaurant.count({ where: { status: 'pending' } })
    ]);

    // Calculate growth rates (comparing to last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      previousOrders,
      previousRevenue,
      previousUsers,
      previousRestaurants
    ] = await Promise.all([
      Order.count({ where: { createdAt: { [Op.lt]: lastMonth } } }),
      Order.sum('total', { where: { createdAt: { [Op.lt]: lastMonth } } }),
      User.count({ where: { createdAt: { [Op.lt]: lastMonth } } }),
      Restaurant.count({ where: { createdAt: { [Op.lt]: lastMonth } } })
    ]);

    const stats = {
      orders: {
        total: totalOrders,
        growth: calculateGrowth(totalOrders, previousOrders)
      },
      revenue: {
        total: totalRevenue || 0,
        growth: calculateGrowth(totalRevenue, previousRevenue)
      },
      users: {
        total: totalUsers,
        growth: calculateGrowth(totalUsers, previousUsers)
      },
      restaurants: {
        total: totalRestaurants,
        growth: calculateGrowth(totalRestaurants, previousRestaurants)
      }
    };

    const restaurantStats = {
      pending: pendingRestaurants,
      active: await Restaurant.count({ where: { status: 'active' } }),
      suspended: await Restaurant.count({ where: { status: 'suspended' } })
    };

    res.status(200).json({
      status: 'success',
      data: { stats, restaurantStats }
    });
  } catch (error) {
    next(error);
  }
};

// Analytics Data
exports.getAnalytics = async (req, res, next) => {
  try {
    const { timeframe } = req.query;
    const startDate = getStartDate(timeframe);

    const [orderTrend, revenueTrend, userGrowth, popularCategories, topCities] = await Promise.all([
      getOrderTrend(startDate),
      getRevenueTrend(startDate),
      getUserGrowth(startDate),
      getPopularCategories(),
      getTopCities()
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        orderTrend,
        revenueTrend,
        userGrowth,
        popularCategories,
        topCities
      }
    });
  } catch (error) {
    next(error);
  }
};

// Recent Activities
exports.getRecentActivities = async (req, res, next) => {
  try {
    const [recentOrders, recentUsers, recentRestaurants] = await Promise.all([
      Order.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'user', attributes: ['name', 'email'] },
          { model: Restaurant, attributes: ['name'] }
        ]
      }),
      User.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
      }),
      Restaurant.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'status', 'createdAt']
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        orders: recentOrders,
        users: recentUsers,
        restaurants: recentRestaurants
      }
    });
  } catch (error) {
    next(error);
  }
};

// Restaurant Management
exports.updateRestaurantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    restaurant.status = status;
    if (adminNotes) restaurant.adminNotes = adminNotes;
    await restaurant.save();

    res.status(200).json({
      status: 'success',
      data: { restaurant }
    });
  } catch (error) {
    next(error);
  }
};

// User Management
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// System Monitoring
exports.getSystemMetrics = async (req, res, next) => {
  try {
    // Get system metrics
    const systemMetrics = {
      cpu: {
        usage: process.cpuUsage(),
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadAvg: os.loadavg(),
        speed: os.cpus()[0].speed
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: (1 - os.freemem() / os.totalmem()) * 100,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      network: os.networkInterfaces(),
      processInfo: {
        pid: process.pid,
        nodeVersion: process.version,
        uptime: process.uptime()
      }
    };

    // Get database metrics
    const [dbMetrics] = await sequelize.query(`
      SELECT 
        COUNT(1) as activeConnections,
        (SELECT COUNT(1) FROM information_schema.tables WHERE table_schema = DATABASE()) as totalTables,
        (SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2)
         FROM information_schema.tables 
         WHERE table_schema = DATABASE()) as dbSizeMB,
        (SELECT COUNT(1) FROM information_schema.processlist) as totalProcesses
    `, { type: sequelize.QueryTypes.SELECT });

    // Get API metrics with detailed performance data
    const [apiMetrics] = await sequelize.query(`
      SELECT 
        COUNT(1) as totalApiCalls,
        AVG(responseTime) as avgResponseTime,
        MAX(responseTime) as maxResponseTime,
        MIN(responseTime) as minResponseTime,
        COUNT(CASE WHEN statusCode >= 400 THEN 1 END) as errorCount,
        COUNT(CASE WHEN statusCode >= 500 THEN 1 END) as serverErrorCount,
        MAX(timestamp) as lastApiCall
      FROM ApiPerformanceLogs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, { type: sequelize.QueryTypes.SELECT });

    // Get service health with response times
    const serviceHealth = {
      database: await testDatabaseHealth(),
      api: await testApiHealth(),
      cache: await testCacheHealth(),
      queue: await testQueueHealth()
    };

    // Get active sessions count
    const activeSessions = await sequelize.query(`
      SELECT COUNT(DISTINCT userId) as activeUsers
      FROM UserActivityLogs
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    `, { type: sequelize.QueryTypes.SELECT });

    res.status(200).json({
      status: 'success',
      data: {
        systemMetrics,
        dbMetrics,
        apiMetrics,
        serviceHealth,
        activeSessions: activeSessions[0].activeUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for health checks
async function testDatabaseHealth() {
  const startTime = Date.now();
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testApiHealth() {
  const startTime = Date.now();
  try {
    await sequelize.query('SELECT 1');
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testCacheHealth() {
  // Implement cache health check based on your caching solution
  return { status: 'healthy', responseTime: 0 };
}

async function testQueueHealth() {
  // Implement queue health check based on your queue solution
  return { status: 'healthy', responseTime: 0 };
}

// User Activity Logs
exports.getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 20, startDate, endDate, activityType } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      filter.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      filter.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (activityType) {
      filter.activityType = activityType;
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get logs from UserActivityLog table (assuming it exists)
    const logs = await sequelize.query(`
      SELECT 
        id, 
        userId, 
        activityType, 
        details, 
        ipAddress, 
        createdAt
      FROM UserActivityLogs
      WHERE ${Object.keys(filter).map(key => `${key} = :${key}`).join(' AND ') || '1=1'}
      ORDER BY createdAt DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...filter, limit: parseInt(limit), offset },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => []);
    
    // Get total count
    const [{ total }] = await sequelize.query(`
      SELECT COUNT(1) as total
      FROM UserActivityLogs
      WHERE ${Object.keys(filter).map(key => `${key} = :${key}`).join(' AND ') || '1=1'}
    `, {
      replacements: filter,
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ total: 0 }]);
    
    res.status(200).json({
      status: 'success',
      results: logs.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};

// API Performance Monitoring
exports.getApiPerformance = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, route, minResponseTime, maxResponseTime, startDate, endDate } = req.query;
    
    // Build filter clauses
    const whereClauses = [];
    const replacements = {};
    
    if (route) {
      whereClauses.push('route LIKE :route');
      replacements.route = `%${route}%`;
    }
    
    if (minResponseTime) {
      whereClauses.push('responseTime >= :minResponseTime');
      replacements.minResponseTime = parseInt(minResponseTime);
    }
    
    if (maxResponseTime) {
      whereClauses.push('responseTime <= :maxResponseTime');
      replacements.maxResponseTime = parseInt(maxResponseTime);
    }
    
    if (startDate && endDate) {
      whereClauses.push('timestamp BETWEEN :startDate AND :endDate');
      replacements.startDate = new Date(startDate);
      replacements.endDate = new Date(endDate);
    } else if (startDate) {
      whereClauses.push('timestamp >= :startDate');
      replacements.startDate = new Date(startDate);
    } else if (endDate) {
      whereClauses.push('timestamp <= :endDate');
      replacements.endDate = new Date(endDate);
    }
    
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    replacements.limit = parseInt(limit);
    replacements.offset = offset;
    
    // Get API performance metrics
    const metrics = await sequelize.query(`
      SELECT 
        route,
        method,
        AVG(responseTime) as avgResponseTime,
        MAX(responseTime) as maxResponseTime,
        MIN(responseTime) as minResponseTime,
        COUNT(1) as requestCount,
        COUNT(CASE WHEN statusCode >= 400 THEN 1 END) as errorCount
      FROM ApiPerformanceLogs
      ${whereClause}
      GROUP BY route, method
      ORDER BY avgResponseTime DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    }).catch(() => []);
    
    // Get total count of distinct routes
    const [{ total }] = await sequelize.query(`
      SELECT COUNT(DISTINCT CONCAT(route, method)) as total
      FROM ApiPerformanceLogs
      ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ total: 0 }]);
    
    res.status(200).json({
      status: 'success',
      results: metrics.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: { metrics }
    });
  } catch (error) {
    next(error);
  }
};

// Marketing Content Management
exports.getMarketingContent = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (type) {
      filter.contentType = type;
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get marketing content
    const contents = await sequelize.query(`
      SELECT 
        id, 
        title, 
        contentType, 
        status, 
        startDate, 
        endDate, 
        targetAudience,
        createdAt,
        updatedAt
      FROM MarketingContent
      WHERE ${Object.keys(filter).map(key => `${key} = :${key}`).join(' AND ') || '1=1'}
      ORDER BY createdAt DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...filter, limit: parseInt(limit), offset },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => []);
    
    // Get total count
    const [{ total }] = await sequelize.query(`
      SELECT COUNT(1) as total
      FROM MarketingContent
      WHERE ${Object.keys(filter).map(key => `${key} = :${key}`).join(' AND ') || '1=1'}
    `, {
      replacements: filter,
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ total: 0 }]);
    
    res.status(200).json({
      status: 'success',
      results: contents.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: { contents }
    });
  } catch (error) {
    next(error);
  }
};

// Create Marketing Content
exports.createMarketingContent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      contentType,
      content,
      status,
      startDate,
      endDate,
      targetAudience,
      channels
    } = req.body;
    
    // Create marketing content
    const marketingContent = await sequelize.query(`
      INSERT INTO MarketingContent (
        title, 
        description,
        contentType, 
        content,
        status,
        startDate,
        endDate,
        targetAudience,
        channels,
        createdAt,
        updatedAt
      ) VALUES (
        :title,
        :description,
        :contentType,
        :content,
        :status,
        :startDate,
        :endDate,
        :targetAudience,
        :channels,
        NOW(),
        NOW()
      )
    `, {
      replacements: {
        title,
        description,
        contentType,
        content,
        status: status || 'draft',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        targetAudience: JSON.stringify(targetAudience || {}),
        channels: JSON.stringify(channels || [])
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    const contentId = marketingContent[0];
    
    // Get created content
    const [newContent] = await sequelize.query(`
      SELECT 
        id, 
        title, 
        description,
        contentType, 
        content,
        status,
        startDate,
        endDate,
        targetAudience,
        channels,
        createdAt,
        updatedAt
      FROM MarketingContent
      WHERE id = :id
    `, {
      replacements: { id: contentId },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(201).json({
      status: 'success',
      data: { content: newContent }
    });
  } catch (error) {
    next(error);
  }
};

// Category Management
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll()
    res.json(categories)
  } catch (error) {
    next(error)
  }
}

exports.createCategory = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400))
      }

      const { name, description, status } = req.body
      const image = req.file ? `/uploads/categories/${req.file.filename}` : null

      const category = await Category.create({
        name,
        description,
        image,
        status
      })

      res.status(201).json(category)
    })
  } catch (error) {
    next(error)
  }
}

exports.updateCategory = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400))
      }

      const { id } = req.params
      const { name, description, status } = req.body
      const updateData = { name, description, status }

      if (req.file) {
        updateData.image = `/uploads/categories/${req.file.filename}`
      }

      const category = await Category.findByPk(id)
      if (!category) {
        return next(new AppError('Category not found', 404))
      }

      await category.update(updateData)
      res.json(category)
    })
  } catch (error) {
    next(error)
  }
}

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params
    const category = await Category.findByPk(id)
    
    if (!category) {
      return next(new AppError('Category not found', 404))
    }

    await category.destroy()
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

// Banner Management
exports.getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll()
    res.json(banners)
  } catch (error) {
    next(error)
  }
}

exports.createBanner = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400))
      }

      const { title, position, link, expiryDate } = req.body
      const image = req.file ? `/uploads/banners/${req.file.filename}` : null

      const banner = await Banner.create({
        title,
        image,
        position,
        link,
        expiryDate,
        active: true
      })

      res.status(201).json(banner)
    })
  } catch (error) {
    next(error)
  }
}

exports.updateBanner = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400))
      }

      const { id } = req.params
      const { title, position, link, expiryDate, active } = req.body
      const updateData = { title, position, link, expiryDate, active }

      if (req.file) {
        updateData.image = `/uploads/banners/${req.file.filename}`
      }

      const banner = await Banner.findByPk(id)
      if (!banner) {
        return next(new AppError('Banner not found', 404))
      }

      await banner.update(updateData)
      res.json(banner)
    })
  } catch (error) {
    next(error)
  }
}

exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params
    const banner = await Banner.findByPk(id)
    
    if (!banner) {
      return next(new AppError('Banner not found', 404))
    }

    await banner.destroy()
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

// Static Page Management
exports.getStaticPages = async (req, res, next) => {
  try {
    const pages = await StaticPage.findAll()
    res.json(pages)
  } catch (error) {
    next(error)
  }
}

exports.createStaticPage = async (req, res, next) => {
  try {
    const { title, slug, content, published } = req.body
    const page = await StaticPage.create({
      title,
      slug,
      content,
      published
    })
    res.status(201).json(page)
  } catch (error) {
    next(error)
  }
}

exports.updateStaticPage = async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, slug, content, published } = req.body

    const page = await StaticPage.findByPk(id)
    if (!page) {
      return next(new AppError('Page not found', 404))
    }

    await page.update({
      title,
      slug,
      content,
      published
    })
    res.json(page)
  } catch (error) {
    next(error)
  }
}

exports.deleteStaticPage = async (req, res, next) => {
  try {
    const { id } = req.params
    const page = await StaticPage.findByPk(id)
    
    if (!page) {
      return next(new AppError('Page not found', 404))
    }

    await page.destroy()
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

// Site Configuration Management
exports.getSiteConfig = async (req, res, next) => {
  try {
    const config = await SiteConfig.findOne()
    res.json(config || {})
  } catch (error) {
    next(error)
  }
}

exports.updateSiteConfig = async (req, res, next) => {
  try {
    const { name, description, contactEmail, supportPhone } = req.body
    
    const [config] = await SiteConfig.findOrCreate({
      where: {},
      defaults: {
        name,
        description,
        contactEmail,
        supportPhone
      }
    })

    if (config) {
      await config.update({
        name,
        description,
        contactEmail,
        supportPhone
      })
    }

    res.json(config)
  } catch (error) {
    next(error)
  }
}

// Helper Functions
const calculateGrowth = (current, previous) => {
  if (!previous) return 100;
  return Number(((current - previous) / previous * 100).toFixed(1));
};

const getStartDate = (timeframe) => {
  const date = new Date();
  switch (timeframe) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'quarter':
      date.setMonth(date.getMonth() - 3);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setDate(date.getDate() - 7);
  }
  return date;
};

const getOrderTrend = async (startDate) => {
  return await Order.findAll({
    where: { createdAt: { [Op.gte]: startDate } },
    attributes: [
      [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
      [sequelize.fn('count', sequelize.col('id')), 'count']
    ],
    group: [sequelize.fn('date', sequelize.col('createdAt'))],
    order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']]
  });
};

const getRevenueTrend = async (startDate) => {
  return await Order.findAll({
    where: { createdAt: { [Op.gte]: startDate } },
    attributes: [
      [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
      [sequelize.fn('sum', sequelize.col('total')), 'total']
    ],
    group: [sequelize.fn('date', sequelize.col('createdAt'))],
    order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']]
  });
};

const getUserGrowth = async (startDate) => {
  return await User.findAll({
    where: { createdAt: { [Op.gte]: startDate } },
    attributes: [
      [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
      [sequelize.fn('count', sequelize.col('id')), 'count']
    ],
    group: [sequelize.fn('date', sequelize.col('createdAt'))],
    order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']]
  });
};

const getPopularCategories = async () => {
  return await Category.findAll({
    attributes: [
      'name',
      [sequelize.fn('count', sequelize.col('Products.id')), 'productCount'],
      [sequelize.fn('sum', sequelize.col('Products.orderCount')), 'orderCount']
    ],
    include: [{
      model: Product,
      attributes: []
    }],
    group: ['Category.id'],
    order: [[sequelize.fn('sum', sequelize.col('Products.orderCount')), 'DESC']],
    limit: 5
  });
};

const getTopCities = async () => {
  return await Restaurant.findAll({
    attributes: [
      'city',
      [sequelize.fn('count', sequelize.col('id')), 'restaurantCount'],
      [sequelize.fn('sum', sequelize.col('orderCount')), 'orderCount']
    ],
    group: ['city'],
    order: [[sequelize.fn('sum', sequelize.col('orderCount')), 'DESC']],
    limit: 5
  });
};