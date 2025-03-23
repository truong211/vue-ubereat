const { Banner } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for banner image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/banners');
  },
  filename: (req, file, cb) => {
    cb(null, `banner-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new AppError('Only image files (jpeg, jpg, png, gif, webp) are allowed!', 400));
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('image');

// Get all banners
exports.findAll = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({
      where: { active: true },
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      status: 'success',
      data: { banners }
    });
  } catch (error) {
    next(error);
  }
};

// Create banner
exports.create = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError('Validation error', 400, errors.array()));
      }

      if (!req.file) {
        return next(new AppError('Banner image is required', 400));
      }

      const { title, position = 'home_top', link, active = true, expiryDate } = req.body;
      const banner = await Banner.create({
        title,
        image: `/uploads/banners/${req.file.filename}`,
        position,
        link,
        active,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      });

      res.status(201).json({
        status: 'success',
        data: { banner }
      });
    });
  } catch (error) {
    next(error);
  }
};

// Update banner
exports.update = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      
      if (!banner) {
        return next(new AppError('Banner not found', 404));
      }

      const { title, position, link, active, expiryDate } = req.body;
      const updateData = {
        title: title || banner.title,
        position: position || banner.position,
        link: link || banner.link,
        active: active !== undefined ? active : banner.active,
        expiryDate: expiryDate ? new Date(expiryDate) : banner.expiryDate
      };

      if (req.file) {
        updateData.image = `/uploads/banners/${req.file.filename}`;
      }

      await banner.update(updateData);

      res.json({
        status: 'success',
        data: { banner }
      });
    });
  } catch (error) {
    next(error);
  }
};

// Delete banner
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return next(new AppError('Banner not found', 404));
    }

    await banner.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Update banner status
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return next(new AppError('Banner not found', 404));
    }

    await banner.update({ active });

    res.json({
      status: 'success',
      data: { banner }
    });
  } catch (error) {
    next(error);
  }
};

// Increment view count
exports.incrementViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return next(new AppError('Banner not found', 404));
    }

    await banner.increment('viewCount');
    res.status(200).json({
      status: 'success',
      data: { viewCount: banner.viewCount + 1 }
    });
  } catch (error) {
    next(error);
  }
};

// Increment click count
exports.incrementClickCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return next(new AppError('Banner not found', 404));
    }

    await banner.increment('clickCount');
    res.status(200).json({
      status: 'success',
      data: { clickCount: banner.clickCount + 1 }
    });
  } catch (error) {
    next(error);
  }
};

// Get banner statistics
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Banner.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('viewCount')), 'totalViews'],
        [sequelize.fn('SUM', sequelize.col('clickCount')), 'totalClicks'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalBanners'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN active = true THEN 1 END')), 'activeBanners']
      ]
    });

    // Calculate CTR (Click-Through Rate)
    const totalViews = parseInt(stats[0].getDataValue('totalViews')) || 0;
    const totalClicks = parseInt(stats[0].getDataValue('totalClicks')) || 0;
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Get performance by position
    const positionStats = await Banner.findAll({
      attributes: [
        'position',
        [sequelize.fn('SUM', sequelize.col('viewCount')), 'views'],
        [sequelize.fn('SUM', sequelize.col('clickCount')), 'clicks'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['position']
    });

    res.json({
      status: 'success',
      data: {
        overview: {
          totalBanners: stats[0].getDataValue('totalBanners'),
          activeBanners: stats[0].getDataValue('activeBanners'),
          totalViews,
          totalClicks,
          ctr: ctr.toFixed(2)
        },
        positionStats
      }
    });
  } catch (error) {
    next(error);
  }
};