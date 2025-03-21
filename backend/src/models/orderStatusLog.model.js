const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./order.model');
const User = require('./user.model');

/**
 * OrderStatusLog Model
 * Tracks all status changes for orders with timestamps
 */
const OrderStatusLog = sequelize.define('OrderStatusLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  changedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    comment: 'User who changed the status (null for system changes)'
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
    comment: 'Geographic location where status was updated (for delivery tracking)'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data about the status change (ETA, driver info, etc.)'
  }
}, {
  timestamps: true,
  tableName: 'order_status_logs',
  indexes: [
    {
      name: 'order_status_log_idx',
      fields: ['orderId', 'createdAt']
    }
  ]
});

// Define associations
OrderStatusLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderStatusLog.belongsTo(User, { foreignKey: 'changedById', as: 'changedBy' });
Order.hasMany(OrderStatusLog, { foreignKey: 'orderId', as: 'statusLogs' });

module.exports = OrderStatusLog;