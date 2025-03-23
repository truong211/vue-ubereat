const express = require('express');
const { body } = require('express-validator');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');
const { promotionErrorHandler } = require('../middleware/promotionError.middleware');
const promotionController = require('../controllers/promotion.controller');
const promotionCampaignController = require('../controllers/promotionCampaign.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Campaign routes
router.use('/campaigns', require('./promotionCampaign.routes'));

// Promotion routes
router.get(
  '/',
  promotionController.getActivePromotions
);

router.post(
  '/validate',
  [
    body('code').notEmpty().trim().withMessage('Promotion code is required'),
    body('orderAmount').isNumeric().withMessage('Valid order amount is required')
  ],
  promotionController.validatePromotion
);

router.post(
  '/',
  restrictTo('admin'),
  [
    body('code').notEmpty().trim().withMessage('Promotion code is required'),
    body('name').notEmpty().withMessage('Promotion name is required'),
    body('type').isIn(['percentage', 'fixed_amount', 'free_delivery'])
      .withMessage('Invalid promotion type'),
    body('value').isNumeric().withMessage('Valid promotion value is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
  ],
  promotionController.createPromotion
);

router.put(
  '/:id',
  restrictTo('admin'),
  [
    body('code').optional().trim(),
    body('type').optional().isIn(['percentage', 'fixed_amount', 'free_delivery']),
    body('value').optional().isNumeric(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601()
  ],
  promotionController.updatePromotion
);

router.get(
  '/stats/:id',
  restrictTo('admin'),
  promotionController.getPromotionStats
);

router.patch(
  '/:id/status',
  restrictTo('admin'),
  [
    body('status').isIn(['active', 'paused', 'expired'])
      .withMessage('Invalid status value')
  ],
  promotionController.updatePromotionStatus
);

router.post(
  '/apply',
  [
    body('orderId').isNumeric().withMessage('Valid order ID is required'),
    body('promotionId').isNumeric().withMessage('Valid promotion ID is required')
  ],
  promotionController.applyPromotion
);

// Stats and Analytics
router.get(
  '/analytics',
  restrictTo('admin'),
  promotionController.getPromotionAnalytics
);

router.get(
  '/performance',
  restrictTo('admin'),
  promotionController.getPromotionPerformance
);

// Apply error handling middleware
router.use(promotionErrorHandler);

module.exports = router;