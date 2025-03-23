const express = require('express');
const router = express.Router();
const banners = require('../controllers/banner.controller');
const { authJwt } = require('../middleware');
const { body } = require('express-validator');

// Public routes
router.get('/', banners.findAll);
router.patch('/:id/view', banners.incrementViewCount);
router.patch('/:id/click', banners.incrementClickCount);

// Admin only routes
router.post('/', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('position').optional().isString().withMessage('Position must be a string'),
  body('link').optional().isURL().withMessage('Link must be a valid URL'),
  body('active').optional().isBoolean(),
  body('expiryDate').optional().isISO8601().withMessage('Invalid date format'),
  body('displayOrder').optional().isNumeric(),
  body('device').optional().isIn(['all', 'mobile', 'desktop']).withMessage('Invalid device type')
], banners.create);

router.put('/:id', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('position').optional().isString(),
  body('link').optional().isURL().withMessage('Link must be a valid URL'),
  body('active').optional().isBoolean(),
  body('expiryDate').optional().isISO8601().withMessage('Invalid date format'),
  body('displayOrder').optional().isNumeric(),
  body('device').optional().isIn(['all', 'mobile', 'desktop']).withMessage('Invalid device type')
], banners.update);

router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], banners.delete);

router.patch('/:id/status', [
  authJwt.verifyToken,
  authJwt.isAdmin,
  body('active').isBoolean().withMessage('Active must be a boolean')
], banners.updateStatus);

router.get('/stats', [authJwt.verifyToken, authJwt.isAdmin], banners.getStats);

module.exports = app => {
  app.use('/api/banners', router);
};