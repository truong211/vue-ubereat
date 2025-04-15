const db = require('../models');
const Notification = db.Notification;
const User = db.User;
const { Op } = require('sequelize');

// Create a new notification for a specific user
exports.create = async (req, res) => {
  try {
    const notification = await Notification.create({
      ...req.body,
      user_id: req.body.userId
    });
    
    res.status(201).send(notification);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi tạo thông báo."
    });
  }
};

// Create a notification for multiple users
exports.createBulk = async (req, res) => {
  try {
    const { userIds, title, message, type, data } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).send({
        message: "Danh sách người dùng không hợp lệ!"
      });
    }
    
    // Create notifications for each user
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: type || 'general',
      data
    }));
    
    const createdNotifications = await Notification.bulkCreate(notifications);
    
    res.status(201).send({
      message: `Đã tạo ${createdNotifications.length} thông báo!`,
      count: createdNotifications.length
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi tạo thông báo hàng loạt."
    });
  }
};

// Create notification for all users
exports.createForAllUsers = async (req, res) => {
  try {
    const { title, message, type, data } = req.body;
    
    // Get all user IDs
    const users = await User.findAll({
      attributes: ['id']
    });
    
    if (users.length === 0) {
      return res.status(404).send({
        message: "Không tìm thấy người dùng nào!"
      });
    }
    
    // Create notifications for each user
    const userIds = users.map(user => user.id);
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: type || 'general',
      data
    }));
    
    const createdNotifications = await Notification.bulkCreate(notifications);
    
    res.status(201).send({
      message: `Đã tạo ${createdNotifications.length} thông báo cho tất cả người dùng!`,
      count: createdNotifications.length
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi tạo thông báo hàng loạt."
    });
  }
};

// Get all notifications for a specific user
exports.findAllForUser = async (req, res) => {
  try {
    const { page = 1, limit = 10, read } = req.query;
    const userId = req.userId; // From JWT token
    const offset = (page - 1) * limit;
    
    let condition = { user_id: userId };
    
    if (read !== undefined) {
      condition.is_read = read === 'true';
    }
    
    const { count, rows } = await Notification.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Count unread notifications
    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
    
    res.send({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      unreadCount,
      notifications: rows
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi lấy danh sách thông báo."
    });
  }
};

// Get all notifications (admin)
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, userId } = req.query;
    const offset = (page - 1) * limit;
    
    let condition = {};
    
    if (type) {
      condition.type = type;
    }
    
    if (userId) {
      condition.user_id = userId;
    }
    
    const { count, rows } = await Notification.findAndCountAll({
      where: condition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.send({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      notifications: rows
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi lấy danh sách thông báo."
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId; // From JWT token
    
    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId
      }
    });
    
    if (!notification) {
      return res.status(404).send({
        message: `Không tìm thấy thông báo với ID=${id}.`
      });
    }
    
    await Notification.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      { where: { id } }
    );
    
    res.send({
      message: "Thông báo đã được đánh dấu là đã đọc!"
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi cập nhật thông báo với ID=${req.params.id}`
    });
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token
    
    await Notification.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      { 
        where: { 
          user_id: userId,
          is_read: false
        } 
      }
    );
    
    res.send({
      message: "Tất cả thông báo đã được đánh dấu là đã đọc!"
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi cập nhật thông báo."
    });
  }
};

// Delete a notification
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const num = await Notification.destroy({
      where: { id }
    });
    
    if (num == 1) {
      res.send({
        message: "Thông báo đã được xóa thành công!"
      });
    } else {
      res.status(404).send({
        message: `Không thể xóa thông báo với ID=${id}. Có thể thông báo không tồn tại!`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi xóa thông báo với ID=${req.params.id}`
    });
  }
};

// Get user notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token
    
    let preferences = await db.NotificationPreference.findOne({
      where: { user_id: userId }
    });
    
    if (!preferences) {
      // Create default preferences if none exist
      preferences = await db.NotificationPreference.create({ 
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        order_updates: true,
        promotions: true
      });
    }
    
    // Return the preferences with camelCase field names for the frontend
    const result = {
      id: preferences.id,
      userId: preferences.user_id,
      emailNotifications: preferences.email_notifications,
      pushNotifications: preferences.push_notifications,
      orderUpdates: preferences.order_updates,
      promotions: preferences.promotions,
      createdAt: preferences.created_at,
      updatedAt: preferences.updated_at
    };
    
    res.send(result);
  } catch (error) {
    console.error('Error in getPreferences:', error);
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi lấy tùy chọn thông báo."
    });
  }
};

// Update user notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token
    const {
      emailNotifications,
      pushNotifications,
      orderUpdates,
      promotions
    } = req.body;
    
    // Convert camelCase to snake_case for database
    const updates = {
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      order_updates: orderUpdates,
      promotions: promotions
    };
    
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    
    let preferences = await db.NotificationPreference.findOne({
      where: { user_id: userId }
    });
    
    if (!preferences) {
      preferences = await db.NotificationPreference.create({
        user_id: userId,
        email_notifications: emailNotifications !== undefined ? emailNotifications : true,
        push_notifications: pushNotifications !== undefined ? pushNotifications : true,
        order_updates: orderUpdates !== undefined ? orderUpdates : true,
        promotions: promotions !== undefined ? promotions : true
      });
    } else {
      await preferences.update(updates);
    }
    
    // Return the updated preferences with camelCase field names for the frontend
    const result = {
      id: preferences.id,
      userId: preferences.user_id,
      emailNotifications: preferences.email_notifications,
      pushNotifications: preferences.push_notifications,
      orderUpdates: preferences.order_updates,
      promotions: preferences.promotions,
      createdAt: preferences.created_at,
      updatedAt: preferences.updated_at
    };
    
    res.send(result);
  } catch (error) {
    console.error('Error in updatePreferences:', error);
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi cập nhật tùy chọn thông báo."
    });
  }
};