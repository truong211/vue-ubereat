const { validationResult } = require('express-validator');
const { StaticPage } = require('../models');
const { AppError } = require('../utils/errors');

/**
 * Get all pages
 * @route GET /api/pages
 * @access Public
 */
exports.getAllPages = async (req, res, next) => {
  try {
    const pages = await StaticPage.findAll({
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
    const page = await StaticPage.findOne({
      where: {
        slug,
        published: true
      }
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

/**
 * Create page
 * @route POST /api/admin/pages
 * @access Private (Admin)
 */
exports.createPage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, slug, content, published } = req.body;
    const page = await StaticPage.create({
      title,
      slug,
      content,
      published: published || false
    });

    res.status(201).json({
      status: 'success',
      data: {
        page
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update page
 * @route PUT /api/admin/pages/:id
 * @access Private (Admin)
 */
exports.updatePage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, slug, content, published } = req.body;

    // First check if page exists
    const existingPage = await StaticPage.findByPk(id);

    if (!existingPage) {
      return next(new AppError('Page not found', 404));
    }

    // Update the page
    await existingPage.update({
      title: title || existingPage.title,
      slug: slug || existingPage.slug,
      content: content || existingPage.content,
      published: published !== undefined ? published : existingPage.published
    });

    // Get updated page
    const updatedPage = await StaticPage.findByPk(id);

    res.status(200).json({
      status: 'success',
      data: {
        page: updatedPage
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete page
 * @route DELETE /api/admin/pages/:id
 * @access Private (Admin)
 */
exports.deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First check if page exists
    const existingPage = await StaticPage.findByPk(id);
    
    if (!existingPage) {
      return next(new AppError('Page not found', 404));
    }

    // Delete the page
    await existingPage.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};