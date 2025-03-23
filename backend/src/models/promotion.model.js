const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');

/**
 * Promotion Model
 * Represents discount codes and promotions
 */
const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount', 'free_delivery'),
    allowNull: false,
    defaultValue: 'percentage'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Discount percentage or fixed amount'
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Minimum order amount required to apply the promotion'
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Maximum discount amount for percentage discounts'
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Restaurant,
      key: 'id'
    },
    comment: 'If null, promotion applies to all restaurants'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total number of times this promotion can be used'
  },
  userUsageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: 'Number of times a single user can use this promotion'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times this promotion has been used'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  appliesTo: {
    type: DataTypes.ENUM('subtotal', 'delivery_fee', 'both'),
    defaultValue: 'subtotal'
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional conditions like specific products or categories'
  },
  forNewUsersOnly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'promotions'
});

// Define associations
Promotion.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Restaurant.hasMany(Promotion, { foreignKey: 'restaurantId', as: 'promotions' });

module.exports = Promotion;