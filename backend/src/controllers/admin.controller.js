const { Restaurant, User, Order, Category, Promotion, Product, Banner } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/error.middleware');
const sequelize = require('../config/database');
const { StaticPage, SiteConfig } = require('../models')
const multer = require('multer')
const path = require('path')

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