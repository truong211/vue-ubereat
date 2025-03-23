const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./order.model');
const Product = require('./product.model');

/**
 * OrderItem Model
 * Represents individual food items in an order
 */
const OrderItem = sequelize.define('OrderItem', {
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
    allowNull: true, // Allow null to handle deleted products
    references: {
      model: Product,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false // Store product name in case product is deleted
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Selected options like size, toppings, etc.'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special instructions for this item'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'order_items'
});

// Define associations
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });

module.exports = OrderItem;