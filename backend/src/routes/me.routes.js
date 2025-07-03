const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const meController = require('../controllers/me.controller');

const router = express.Router();

// All routes below require auth
router.use(authMiddleware);

// GET /api/v1/me – view profile
router.get('/', meController.viewProfile);

// PATCH /api/v1/me – update profile
router.patch(
  '/',
  [
    body('full_name').optional().isLength({ min: 3, max: 100 }),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone(),
    body('avatar_url').optional().isURL()
  ],
  meController.updateProfile
);

// Address endpoints
router.get('/addresses', meController.listAddresses);

router.post(
  '/addresses',
  [
    body('full_address').notEmpty().withMessage('full_address is required'),
    body('label').optional().isString(),
    body('is_default').optional().isBoolean()
  ],
  meController.createAddress
);

router.patch(
  '/addresses/:id',
  [
    body('full_address').optional().isString(),
    body('label').optional().isString(),
    body('is_default').optional().isBoolean()
  ],
  meController.updateAddress
);

router.delete('/addresses/:id', meController.deleteAddress);

router.get('/orders', meController.listOrders);

module.exports = router;