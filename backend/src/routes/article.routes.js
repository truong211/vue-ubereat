const express = require('express');
const router = express.Router();
const articles = require('../controllers/article.controller');
const { authJwt } = require('../middleware');
const { body } = require('express-validator');

// Public routes
router.get('/', articles.findAll);
router.get('/stats', articles.getStats);
router.get('/:slug', articles.findBySlug);

// Admin only routes
router.post('/', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').optional().isIn(['news', 'blog', 'guide', 'faq']).withMessage('Invalid article type'),
  body('language').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid language code'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('tags').optional().isArray(),
  body('categories').optional().isArray(),
  body('isHighlighted').optional().isBoolean(),
  body('sortOrder').optional().isNumeric(),
  body('metadata').optional().isObject()
], articles.create);

router.put('/:id', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('type').optional().isIn(['news', 'blog', 'guide', 'faq']).withMessage('Invalid article type'),
  body('language').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid language code'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('tags').optional().isArray(),
  body('categories').optional().isArray(),
  body('isHighlighted').optional().isBoolean(),
  body('sortOrder').optional().isNumeric(),
  body('metadata').optional().isObject()
], articles.update);

router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], articles.delete);

router.patch('/:id/status', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
], articles.updateStatus);

module.exports = app => {
  app.use('/api/articles', router);
};