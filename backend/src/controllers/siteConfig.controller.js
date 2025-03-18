const { validationResult } = require('express-validator');
const { SiteConfig } = require('../models');
const { AppError } = require('../middleware/error.middleware');

/**
 * Get site configuration
 * @route GET /api/config
 * @access Public
 */
exports.getSiteConfig = async (req, res, next) => {
  try {
    const config = await SiteConfig.findOne();
    
    if (!config) {
      // Create default config if none exists
      const defaultConfig = await SiteConfig.create({
        name: 'UberEat',
        description: 'Food delivery platform',
        contactEmail: 'contact@ubereats.com',
        supportPhone: '+1234567890'
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          config: defaultConfig
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        config
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update site configuration
 * @route PUT /api/admin/config
 * @access Private (Admin)
 */
exports.updateSiteConfig = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, contactEmail, supportPhone } = req.body;

    let config = await SiteConfig.findOne();
    
    if (!config) {
      config = await SiteConfig.create({
        name,
        description,
        contactEmail,
        supportPhone
      });
    } else {
      config.name = name || config.name;
      config.description = description || config.description;
      config.contactEmail = contactEmail || config.contactEmail;
      config.supportPhone = supportPhone || config.supportPhone;
      
      await config.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        config
      }
    });
  } catch (error) {
    next(error);
  }
};