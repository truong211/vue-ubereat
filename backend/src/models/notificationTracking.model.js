'use strict';

module.exports = (sequelize, DataTypes) => {
  const NotificationTracking = sequelize.define('NotificationTracking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isClicked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    clickedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveryStatus: {
      type: DataTypes.ENUM('sent', 'delivered', 'failed'),
      defaultValue: 'sent'
    }
  }, {
    tableName: 'notification_trackings',
    timestamps: true
  });

  NotificationTracking.associate = function(models) {
    if (models.Notification) {
      NotificationTracking.belongsTo(models.Notification, {
        foreignKey: 'notificationId',
        as: 'notification'
      });
    }
    
    if (models.User) {
      NotificationTracking.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return NotificationTracking;
};