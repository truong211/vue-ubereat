const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  next();
};

// Validate operating hours
exports.validateOperatingHours = [
  body('openingHours')
    .notEmpty()
    .withMessage('Opening hours are required')
    .isObject()
    .withMessage('Opening hours must be an object'),
  body('openingHours.*')
    .isObject()
    .withMessage('Each day must be an object'),
  body('openingHours.*.enabled')
    .isBoolean()
    .withMessage('Enabled status must be a boolean'),
  body('openingHours.*.open')
    .if(body('openingHours.*.enabled').equals(true))
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),
  body('openingHours.*.close')
    .if(body('openingHours.*.enabled').equals(true))
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Close time must be in HH:MM format')
    .custom((value, { req, path }) => {
      // Extract day from path (e.g., 'openingHours.Monday.close' -> 'Monday')
      const day = path.split('.')[1];
      const openTime = req.body.openingHours[day].open;
      if (openTime && value <= openTime) {
        throw new Error('Closing time must be after opening time');
      }
      return true;
    }),
  body('specialHolidays')
    .optional()
    .isArray()
    .withMessage('Special holidays must be an array'),
  body('specialHolidays.*.date')
    .optional()
    .isISO8601()
    .withMessage('Holiday date must be a valid date'),
  body('specialHolidays.*.isOpen')
    .optional()
    .isBoolean()
    .withMessage('Holiday open status must be a boolean'),
  body('specialHolidays.*.openTime')
    .if(body('specialHolidays.*.isOpen').equals(true))
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Holiday open time must be in HH:MM format'),
  body('specialHolidays.*.closeTime')
    .if(body('specialHolidays.*.isOpen').equals(true))
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Holiday close time must be in HH:MM format')
    .custom((value, { req, path }) => {
      const index = parseInt(path.split('.')[1]);
      const openTime = req.body.specialHolidays[index].openTime;
      if (openTime && value <= openTime) {
        throw new Error('Holiday closing time must be after opening time');
      }
      return true;
    }),
  handleValidationErrors
];

// Validate special holidays
exports.validateSpecialHolidays = [
  body('specialHolidays')
    .isArray()
    .withMessage('Special holidays must be an array'),
  body('specialHolidays.*.date')
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),
  body('specialHolidays.*.isOpen')
    .isBoolean()
    .withMessage('isOpen must be a boolean'),
  body('specialHolidays.*.openTime')
    .optional({ nullable: true })
    .isString()
    .withMessage('Open time must be a string in format HH:MM'),
  body('specialHolidays.*.closeTime')
    .optional({ nullable: true })
    .isString()
    .withMessage('Close time must be a string in format HH:MM'),
  body('specialHolidays.*.name')
    .optional()
    .isString()
    .withMessage('Holiday name must be a string'),
  handleValidationErrors
];

// Validate delivery settings
exports.validateDeliverySettings = [
  body('deliverySettings')
    .notEmpty()
    .withMessage('Delivery settings are required')
    .isObject()
    .withMessage('Delivery settings must be an object'),
  body('deliverySettings.radius')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Delivery radius must be a positive number'),
  body('deliverySettings.minOrder')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number'),
  body('deliverySettings.baseFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base delivery fee must be a non-negative number'),
  body('deliverySettings.perKmFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Per kilometer fee must be a non-negative number'),
  body('deliverySettings.autoAccept')
    .optional()
    .isBoolean()
    .withMessage('Auto accept must be a boolean'),
  body('deliverySettings.pickupEnabled')
    .optional()
    .isBoolean()
    .withMessage('Pickup enabled must be a boolean'),
  handleValidationErrors
];

// Validate menu availability
exports.validateMenuAvailability = [
  body('menuAvailability')
    .notEmpty()
    .withMessage('Menu availability settings are required')
    .isObject()
    .withMessage('Menu availability settings must be an object'),
  body('menuAvailability.scheduleEnabled')
    .isBoolean()
    .withMessage('Schedule enabled must be a boolean'),
  body('menuAvailability.defaultAvailability')
    .isBoolean()
    .withMessage('Default availability must be a boolean'),
  body('menuAvailability.schedules')
    .optional()
    .isArray()
    .withMessage('Schedules must be an array'),
  body('menuAvailability.schedules.*.itemId')
    .optional()
    .isInt()
    .withMessage('Item ID must be an integer'),
  body('menuAvailability.schedules.*.categoryId')
    .optional()
    .isInt()
    .withMessage('Category ID must be an integer'),
  body('menuAvailability.schedules.*.availability')
    .isBoolean()
    .withMessage('Availability must be a boolean'),
  body('menuAvailability.schedules.*.startTime')
    .isString()
    .withMessage('Start time must be a string in format HH:MM'),
  body('menuAvailability.schedules.*.endTime')
    .isString()
    .withMessage('End time must be a string in format HH:MM'),
  body('menuAvailability.schedules.*.days')
    .isArray()
    .withMessage('Days must be an array of strings'),
  handleValidationErrors
];

// Validate temporary closure
exports.validateTemporaryClosure = [
  body('tempClosureSettings')
    .notEmpty()
    .withMessage('Temporary closure settings are required')
    .isObject()
    .withMessage('Temporary closure settings must be an object'),
  body('tempClosureSettings.isTemporarilyClosed')
    .isBoolean()
    .withMessage('isTemporarilyClosed must be a boolean'),
  body('tempClosureSettings.reopenDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Reopen date must be in ISO 8601 format'),
  body('tempClosureSettings.closureReason')
    .optional({ nullable: true })
    .isString()
    .withMessage('Closure reason must be a string'),
  body('tempClosureSettings.showReason')
    .optional()
    .isBoolean()
    .withMessage('Show reason must be a boolean'),
  body('tempClosureSettings.acceptPreOrders')
    .optional()
    .isBoolean()
    .withMessage('Accept pre-orders must be a boolean'),
  handleValidationErrors
];

// Validate availability status
exports.validateAvailabilityStatus = [
  body('isOpen')
    .optional()
    .isBoolean()
    .withMessage('isOpen must be a boolean'),
  body('availabilityStatus')
    .optional()
    .isIn(['online', 'busy', 'offline', 'temporarily_closed'])
    .withMessage('Invalid availability status'),
  body('busyLevel')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Busy level must be an integer between 1 and 5'),
  body('estimatedPrepTime')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Estimated preparation time must be a positive integer'),
  body('statusMessage')
    .optional({ nullable: true })
    .isString()
    .withMessage('Status message must be a string')
    .isLength({ max: 255 })
    .withMessage('Status message must not exceed 255 characters'),
  body('acceptingOrders')
    .optional()
    .isBoolean()
    .withMessage('acceptingOrders must be a boolean'),
  handleValidationErrors
];