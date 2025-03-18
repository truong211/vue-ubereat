const express = require('express');
const { body } = require('express-validator');
const staticPageController = require('../controllers/staticPage.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', staticPageController.getAllPages);
router.get('/:slug', staticPageController.getPageBySlug);

// Admin routes
router.use(authMiddleware);
router.use(restrictTo('admin'));

router.post(
  '/',
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('slug')
      .notEmpty()
      .withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    body('content')
      .notEmpty()
      .withMessage('Content is required'),
    body('published')
      .optional()
      .isBoolean()
      .withMessage('Published must be a boolean')
  ],
  staticPageController.createPage
);

router.put(
  '/:id',
  [
    body('title')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('slug')
      .optional()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    body('published')
      .optional()
      .isBoolean()
      .withMessage('Published must be a boolean')
  ],
  staticPageController.updatePage
);

router.delete('/:id', staticPageController.deletePage);

module.exports = router;