const db = require('../models');
const Notification = db.Notification;
const User = db.User;
const { Op } = require('sequelize');

// Create a new notification for a specific user
exports.create = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    
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
      userId,
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
      userId,
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
    
    let condition = { userId };
    
    if (read !== undefined) {
      condition.read = read === 'true';
    }
    
    const { count, rows } = await Notification.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    // Count unread notifications
    const unreadCount = await Notification.count({
      where: {
        userId,
        read: false
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
      condition.userId = userId;
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
      order: [['createdAt', 'DESC']]
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
        userId
      }
    });
    
    if (!notification) {
      return res.status(404).send({
        message: `Không tìm thấy thông báo với ID=${id}.`
      });
    }
    
    await Notification.update(
      { 
        read: true,
        readAt: new Date()
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
        read: true,
        readAt: new Date()
      },
      { 
        where: { 
          userId,
          read: false
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

// Update user notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const preferences = req.body;
    
    await User.update(
      { notificationPreferences: preferences },
      { where: { id: userId } }
    );
    
    res.send({
      message: "Cài đặt thông báo đã được cập nhật!"
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi cập nhật cài đặt thông báo."
    });
  }
};

// Get user notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await User.findByPk(userId, {
      attributes: ['notificationPreferences']
    });
    
    if (!user) {
      return res.status(404).send({
        message: "Không tìm thấy người dùng!"
      });
    }
    
    res.send(user.notificationPreferences);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi lấy cài đặt thông báo."
    });
  }
};