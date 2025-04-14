'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Changed to allow null for system-wide notifications
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('order', 'promotion', 'system', 'payment', 'delivery', 'account'),
      defaultValue: 'system'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isSystemWide: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      defaultValue: 'normal'
    }
  }, {
    tableName: 'notifications',
    timestamps: true
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Static method to find unread notifications for a user
  Notification.findUnreadByUser = async function(userId) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { userId },
          { isSystemWide: true }
        ],
        isRead: false
      },
      order: [['createdAt', 'DESC']]
    });
  };

  // Static method to find all notifications for a user
  Notification.findAllByUser = async function(userId, limit = 20, offset = 0) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { userId },
          { isSystemWide: true }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  };

  // Static method to create a system-wide notification
  Notification.createSystemWide = async function(data) {
    return this.create({
      ...data,
      isSystemWide: true,
      userId: null
    });
  };

  return Notification;
};