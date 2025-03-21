const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general',
      comment: 'Notification type: order_status, driver_location, promotion, marketing, system, etc.'
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data for the notification (e.g., orderId, driverId, promotionId, etc.)'
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // For push notification subscriptions
    endpoint: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Push subscription endpoint URL'
    },
    subscription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Full push subscription object as JSON string'
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User agent of the device'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: 'Whether the subscription is active'
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        name: 'idx_notifications_user_id',
        fields: ['userId'],
      },
      {
        name: 'idx_notifications_read',
        fields: ['read'],
      },
      {
        name: 'idx_notifications_type',
        fields: ['type'],
      },
      {
        name: 'idx_notifications_endpoint',
        fields: ['endpoint'],
        unique: true,
        where: {
          endpoint: {
            [sequelize.Op.ne]: null
          }
        }
      },
    ],
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Notification;
};