const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Order = require('./order.model');

/**
 * PaymentHistory Model
 * Tracks all payment transactions in the system
 */
const PaymentHistory = sequelize.define('PaymentHistory', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'e_wallet'),
    allowNull: false
  },
  paymentType: {
    type: DataTypes.ENUM('payment', 'refund'),
    defaultValue: 'payment'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDetails: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'payment_history'
});

// Define associations
PaymentHistory.belongsTo(User, { foreignKey: 'userId' });
PaymentHistory.belongsTo(Order, { foreignKey: 'orderId' });
User.hasMany(PaymentHistory, { foreignKey: 'userId' });
Order.hasMany(PaymentHistory, { foreignKey: 'orderId' });

module.exports = PaymentHistory;