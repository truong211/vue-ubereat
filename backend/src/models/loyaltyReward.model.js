const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');

const LoyaltyReward = sequelize.define('LoyaltyReward', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Restaurant,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pointsRequired: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rewardType: {
    type: DataTypes.ENUM('discount', 'free_item', 'delivery_fee', 'special_offer'),
    allowNull: false
  },
  rewardValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'all'),
    defaultValue: 'all'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'loyalty_rewards',
  timestamps: true,
  underscored: true,
  freezeTableName: true
});

// Define associations
LoyaltyReward.associate = function(models) {
  LoyaltyReward.belongsTo(models.Restaurant, {
    foreignKey: 'restaurantId',
    as: 'restaurant',
    constraints: false
  });
};

module.exports = LoyaltyReward;