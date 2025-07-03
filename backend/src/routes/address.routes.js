const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/addresses
 * @desc Get all addresses for the logged-in user
 * @access Private
 */
router.get('/', addressController.getAddresses);

/**
 * @route GET /api/addresses/:id
 * @desc Get a single address by ID
 * @access Private
 */
router.get('/:id', addressController.getAddress);

/**
 * @route POST /api/addresses
 * @desc Create a new address
 * @access Private
 */
router.post(
  '/',
  [
    body('name')
      .notEmpty()
      .withMessage('Address name is required'),
    body('addressLine1')
      .notEmpty()
      .withMessage('Address line 1 is required'),
    body('city')
      .notEmpty()
      .withMessage('City is required'),
    body('state')
      .notEmpty()
      .withMessage('State is required'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code is required')
  ],
  addressController.createAddress
);

/**
 * @route PATCH /api/addresses/:id
 * @desc Update an address
 * @access Private
 */
router.patch(
  '/:id',
  [
    body('name')
      .optional()
      .isLength({ min: 1 })
      .withMessage('Address name cannot be empty'),
    body('addressLine1')
      .optional()
      .isLength({ min: 1 })
      .withMessage('Address line 1 cannot be empty'),
    body('city')
      .optional()
      .isLength({ min: 1 })
      .withMessage('City cannot be empty'),
    body('state')
      .optional()
      .isLength({ min: 1 })
      .withMessage('State cannot be empty'),
    body('postalCode')
      .optional()
      .isLength({ min: 1 })
      .withMessage('Postal code cannot be empty')
  ],
  addressController.updateAddress
);

/**
 * @route DELETE /api/addresses/:id
 * @desc Delete an address
 * @access Private
 */
router.delete('/:id', addressController.deleteAddress);

/**
 * @route PATCH /api/addresses/:id/default
 * @desc Set an address as default
 * @access Private
 */
router.patch(
  '/:id/default',
  [
    param('id').isInt().withMessage('Invalid address ID')
  ],
  addressController.setDefaultAddress
);

/**
 * @route GET /api/addresses/places
 * @desc Get places for address search suggestions
 * @access Private
 */
router.get('/places/search', addressController.getPlaces);

/**
 * @route GET /api/addresses/places/:placeId
 * @desc Get place details by place_id
 * @access Private
 */
router.get('/places/:placeId', addressController.getPlaceDetails);

module.exports = router;