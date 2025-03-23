const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');
const PromotionCampaign = require('./promotionCampaign.model');

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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
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
  maxDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Maximum discount amount for percentage discounts'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxRedemptions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of times this promotion can be used'
  },
  currentRedemptions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current number of times this promotion has been used'
  },
  maxPerUser: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Maximum times a single user can use this promotion'
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'expired'),
    defaultValue: 'active'
  },
  applicableTo: {
    type: DataTypes.ENUM('all', 'selected_restaurants', 'categories'),
    defaultValue: 'all'
  },
  userType: {
    type: DataTypes.ENUM('all', 'new', 'existing'),
    defaultValue: 'all'
  },
  // Analytics fields
  totalDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total discount amount given through this promotion'
  },
  totalOrderValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total order value of orders using this promotion'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this promotion was used'
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Restaurant,
      key: 'id'
    },
    comment: 'If null, promotion applies to all restaurants'
  }
}, {
  timestamps: true,
  tableName: 'promotions',
  indexes: [
    {
      fields: ['code'],
      unique: true
    },
    {
      fields: ['status', 'startDate', 'endDate']
    },
    {
      fields: ['restaurantId']
    }
  ]
});

// Define associations
Promotion.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Restaurant.hasMany(Promotion, { foreignKey: 'restaurantId', as: 'promotions' });

// Add campaign association
Promotion.belongsTo(PromotionCampaign, { foreignKey: 'campaignId', as: 'campaign' });
PromotionCampaign.hasMany(Promotion, { foreignKey: 'campaignId', as: 'promotions' });

module.exports = Promotion;