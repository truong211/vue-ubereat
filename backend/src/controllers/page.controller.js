const { validationResult } = require('express-validator');
const { getDb } = require('../models');
const { AppError } = require('../middleware/error.middleware');

let Page;
const initModels = async () => {
  if (!Page) {
    const db = await getDb();
    Page = db.Page;
  }
  return Page;
};

/**
 * Get all pages
 * @route GET /api/pages
 * @access Public
 */
exports.getPages = async (req, res, next) => {
  try {
    const PageModel = await initModels();
    const pages = await PageModel.findAll({
      where: {
        isPublished: true
      },
      attributes: ['id', 'slug', 'title', 'content', 'updatedAt'],
      order: [['title', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      data: {
        pages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get page by slug
 * @route GET /api/pages/:slug
 * @access Public
 */
exports.getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const PageModel = await initModels();
    const page = await PageModel.findOne({
      where: {
        slug,
        isPublished: true
      },
      attributes: ['id', 'slug', 'title', 'content', 'updatedAt']
    });

    if (!page) {
      return next(new AppError('Page not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        page
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;