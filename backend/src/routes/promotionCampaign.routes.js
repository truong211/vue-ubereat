const express = require('express');
const { body } = require('express-validator');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const promotionCampaignController = require('../controllers/promotionCampaign.controller');

const router = express.Router();

// Categories routes
router.post(
  '/categories',
  authMiddleware,
  restrictTo('admin'),
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('description').optional()
  ],
  promotionCampaignController.createCategory
);

router.get(
  '/categories',
  authMiddleware,
  restrictTo('admin'),
  promotionCampaignController.getCategories
);

// Campaigns routes
router.post(
  '/campaigns',
  authMiddleware,
  restrictTo('admin'),
  [
    body('name').notEmpty().withMessage('Campaign name is required'),
    body('description').optional(),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
    body('budget').optional().isNumeric().withMessage('Budget must be a number'),
    body('targetAudience').optional().isObject().withMessage('Target audience must be an object')
  ],
  promotionCampaignController.createCampaign
);

router.get(
  '/campaigns',
  authMiddleware,
  restrictTo('admin'),
  promotionCampaignController.getCampaigns
);

router.get(
  '/campaigns/:id/stats',
  authMiddleware,
  restrictTo('admin'),
  promotionCampaignController.getCampaignStats
);

router.patch(
  '/campaigns/:id/status',
  authMiddleware,
  restrictTo('admin'),
  [
    body('status')
      .isIn(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'])
      .withMessage('Invalid status')
  ],
  promotionCampaignController.updateCampaignStatus
);

router.put(
  '/campaigns/:id',
  authMiddleware,
  restrictTo('admin'),
  [
    body('name').optional(),
    body('description').optional(),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('budget').optional().isNumeric().withMessage('Budget must be a number'),
    body('targetAudience').optional().isObject().withMessage('Target audience must be an object')
  ],
  promotionCampaignController.updateCampaign
);

module.exports = router;