const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for system-wide notifications
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of notification (ORDER_STATUS, DRIVER_LOCATION, SYSTEM, PROMOTION, etc.)'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'low'
    },
    isSystemWide: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If true, notification is visible to all users'
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional expiry date for the notification'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      comment: 'Subscription endpoint URL'
    },
    subscription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Stringified web push subscription data'
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Notifications',
    timestamps: true,
    indexes: [],
    sync: {
      alter: false,
      force: false
    }
  });

  Notification.associate = function(models) {
    // Commented out to fix loading issues
    // Notification.belongsTo(models.User, {
    //   foreignKey: 'userId',
    //   as: 'user'
    // });
  };

  return Notification;
};