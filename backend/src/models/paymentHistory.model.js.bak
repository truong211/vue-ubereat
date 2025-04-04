const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Order = require('./order.model');

class PaymentHistory extends Model {}

PaymentHistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  payment_method: {
    type: DataTypes.ENUM('card', 'momo', 'vnpay', 'zalopay'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'VND'
  },
  status: {
    type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  transaction_ref: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  payment_details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  verification_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refund_status: {
    type: DataTypes.ENUM('none', 'pending', 'completed', 'failed'),
    defaultValue: 'none'
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'PaymentHistory',
  tableName: 'payment_histories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['transaction_ref'],
      unique: true
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
PaymentHistory.belongsTo(User, { foreignKey: 'user_id' });
PaymentHistory.belongsTo(Order, { foreignKey: 'order_id' });
User.hasMany(PaymentHistory, { foreignKey: 'user_id' });
Order.hasMany(PaymentHistory, { foreignKey: 'order_id' });

module.exports = PaymentHistory;