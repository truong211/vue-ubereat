const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./order.model');
const Product = require('./product.model');

/**
 * OrderDetail Model
 * Represents individual items in an order
 */
const OrderDetail = sequelize.define('OrderDetail', {
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
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'order_details'
});

// Define associations
OrderDetail.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderDetail.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Order.hasMany(OrderDetail, { foreignKey: 'orderId', as: 'orderDetails' });
Product.hasMany(OrderDetail, { foreignKey: 'productId', as: 'orderDetails' });

module.exports = OrderDetail; 