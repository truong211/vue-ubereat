const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class NotificationSubscription extends Model {
  static associate(models) {
    NotificationSubscription.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  }
}

NotificationSubscription.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'user_id'
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Subscription endpoint URL'
  },
  subscription: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Stringified web push subscription data'
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'User agent of the browser that created the subscription',
    field: 'user_agent'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the subscription is currently active'
  },
  last_used: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this subscription was used to send a notification',
    field: 'last_used'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'NotificationSubscription',
  tableName: 'notification_subscriptions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = NotificationSubscription; 