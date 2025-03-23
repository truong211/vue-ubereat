const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class NotificationTracking extends Model {}

NotificationTracking.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notificationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Notifications',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  deliveryStatus: {
    type: DataTypes.ENUM('sent', 'delivered', 'failed', 'clicked'),
    defaultValue: 'sent'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clickedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  errorDetails: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'NotificationTracking',
  tableName: 'notification_tracking',
  timestamps: true,
  indexes: [
    {
      fields: ['notificationId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['deliveryStatus']
    },
    {
      fields: ['deliveredAt']
    },
    {
      fields: ['clickedAt']
    }
  ]
});

// Define associations
NotificationTracking.associate = (models) => {
  NotificationTracking.belongsTo(models.Notification, {
    foreignKey: 'notificationId',
    as: 'notification'
  });
  NotificationTracking.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = NotificationTracking;