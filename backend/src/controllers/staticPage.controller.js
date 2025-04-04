const { validationResult } = require('express-validator');
const db = require('../config/database');
const { AppError } = require('../utils/errors');

/**
 * Get all pages
 * @route GET /api/pages
 * @access Public
 */
exports.getAllPages = async (req, res, next) => {
  try {
    const pages = await db.query(
      'SELECT * FROM static_pages ORDER BY title ASC'
    );

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
    const [page] = await db.query(
      'SELECT * FROM static_pages WHERE slug = ? AND published = TRUE',
      [slug]
    );

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
    const result = await db.query(
      'INSERT INTO static_pages (title, slug, content, published, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [title, slug, content, published || false]
    );

    const [page] = await db.query(
      'SELECT * FROM static_pages WHERE id = ?',
      [result.insertId]
    );

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
    const [existingPage] = await db.query(
      'SELECT * FROM static_pages WHERE id = ?',
      [id]
    );

    if (!existingPage) {
      return next(new AppError('Page not found', 404));
    }

    // Update the page
    await db.query(
      'UPDATE static_pages SET title = ?, slug = ?, content = ?, published = ?, updatedAt = NOW() WHERE id = ?',
      [
        title || existingPage.title,
        slug || existingPage.slug,
        content || existingPage.content,
        published !== undefined ? published : existingPage.published,
        id
      ]
    );

    // Get updated page
    const [updatedPage] = await db.query(
      'SELECT * FROM static_pages WHERE id = ?',
      [id]
    );

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
    const [existingPage] = await db.query(
      'SELECT * FROM static_pages WHERE id = ?',
      [id]
    );
    
    if (!existingPage) {
      return next(new AppError('Page not found', 404));
    }

    // Delete the page
    await db.query(
      'DELETE FROM static_pages WHERE id = ?',
      [id]
    );

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};