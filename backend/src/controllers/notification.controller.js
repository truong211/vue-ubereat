const { validationResult } = require('express-validator');
const { getDb } = require('../models');
const { AppError } = require('../middleware/error.middleware');

/**
 * Get user notifications with pagination
 * @route GET /api/notifications
 * @access Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    
    // If no authenticated user, return empty results
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: {
          notifications: [],
          total: 0,
          page,
          pages: 0
        }
      });
    }

    const db = await getDb();
    const offset = (page - 1) * limit;

    const { rows: notifications, count } = await db.Notification.findAndCountAll({
      where: {
        userId: req.user.id,
        isArchived: false
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user notification preferences
 * @route GET /api/notifications/preferences
 * @access Private
 */
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    // If no authenticated user, return default preferences
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: {
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            preferences: {}
          }
        }
      });
    }

    const db = await getDb();
    let preferences = await db.NotificationPreferences.findOne({
      where: {
        userId: req.user.id
      }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await db.NotificationPreferences.create({
        userId: req.user.id,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        preferences: {}
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user notification preferences
 * @route PUT /api/notifications/preferences
 * @access Private
 */
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const db = await getDb();
    const { emailNotifications, pushNotifications, smsNotifications, preferences } = req.body;

    let userPreferences = await db.NotificationPreferences.findOne({
      where: {
        userId: req.user.id
      }
    });

    if (!userPreferences) {
      userPreferences = await db.NotificationPreferences.create({
        userId: req.user.id
      });
    }

    await userPreferences.update({
      emailNotifications: emailNotifications !== undefined ? emailNotifications : userPreferences.emailNotifications,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : userPreferences.pushNotifications,
      smsNotifications: smsNotifications !== undefined ? smsNotifications : userPreferences.smsNotifications,
      preferences: preferences ? {
        ...userPreferences.preferences,
        ...preferences
      } : userPreferences.preferences
    });

    res.status(200).json({
      status: 'success',
      data: {
        preferences: userPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const db = await getDb();
    const notification = await db.Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.update({ isRead: true });

    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;