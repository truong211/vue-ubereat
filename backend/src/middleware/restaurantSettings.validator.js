const { body, param } = require('express-validator');

exports.validateOpeningHours = [
  body('openingHours').isObject().withMessage('Opening hours must be an object'),
  body('openingHours.*').isObject().withMessage('Each day must be an object'),
  body('openingHours.*.enabled').isBoolean().withMessage('Enabled status must be boolean'),
  body('openingHours.*.open')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Open time must be in HH:mm format'),
  body('openingHours.*.close')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Close time must be in HH:mm format')
];

exports.validateDeliverySettings = [
  body('deliverySettings').isObject().withMessage('Delivery settings must be an object'),
  body('deliverySettings.radius')
    .isFloat({ min: 0 })
    .withMessage('Delivery radius must be a positive number'),
  body('deliverySettings.minOrder')
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a positive number'),
  body('deliverySettings.baseFee')
    .isFloat({ min: 0 })
    .withMessage('Base fee must be a positive number'),
  body('deliverySettings.perKmFee')
    .isFloat({ min: 0 })
    .withMessage('Per kilometer fee must be a positive number'),
  body('deliverySettings.autoAccept')
    .isBoolean()
    .withMessage('Auto accept must be a boolean'),
  body('deliverySettings.pickupEnabled')
    .isBoolean()
    .withMessage('Pickup enabled must be a boolean')
];

exports.validateNotificationPreferences = [
  body('notificationPreferences').isObject().withMessage('Notification preferences must be an object'),
  body('notificationPreferences.email').isBoolean().withMessage('Email preference must be boolean'),
  body('notificationPreferences.sms').isBoolean().withMessage('SMS preference must be boolean'),
  body('notificationPreferences.push').isBoolean().withMessage('Push preference must be boolean'),
  body('notificationPreferences.newOrders').isBoolean().withMessage('New orders preference must be boolean'),
  body('notificationPreferences.orderUpdates').isBoolean().withMessage('Order updates preference must be boolean'),
  body('notificationPreferences.reviews').isBoolean().withMessage('Reviews preference must be boolean')
];

exports.validateSpecialHolidays = [
  body('specialHolidays').isArray().withMessage('Special holidays must be an array'),
  body('specialHolidays.*.date').isISO8601().withMessage('Date must be in ISO format'),
  body('specialHolidays.*.isOpen').isBoolean().withMessage('isOpen must be boolean'),
  body('specialHolidays.*.openTime')
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Open time must be in HH:mm format'),
  body('specialHolidays.*.closeTime')
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Close time must be in HH:mm format')
];