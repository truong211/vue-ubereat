const express = require('express');
const { body } = require('express-validator');
const siteConfigController = require('../controllers/siteConfig.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route
router.get('/', siteConfigController.getSiteConfig);

// Admin routes
router.use(authMiddleware);
router.use(restrictTo('admin'));

router.put(
  '/',
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('contactEmail')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('supportPhone')
      .optional()
      .matches(/^\+?[\d\s-]+$/)
      .withMessage('Please provide a valid phone number')
  ],
  siteConfigController.updateSiteConfig
);

module.exports = router;