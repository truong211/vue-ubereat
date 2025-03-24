'use strict';

module.exports = (sequelize, DataTypes) => {
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
        model: 'Restaurants',
        key: 'id'
      },
      comment: 'If null, reward is available across all restaurants'
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
      allowNull: false,
      validate: {
        min: 1
      }
    },
    rewardType: {
      type: DataTypes.ENUM('discount', 'free_item', 'delivery_fee', 'special_offer'),
      allowNull: false
    },
    rewardValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Value depends on rewardType (e.g. percentage discount)'
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'all'),
      defaultValue: 'all',
      comment: 'Minimum tier required to redeem'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'loyalty_rewards',
    timestamps: true
  });

  LoyaltyReward.associate = (models) => {
    // Reward can belong to a specific restaurant
    LoyaltyReward.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });

    // Reward has many redemptions
    LoyaltyReward.hasMany(models.LoyaltyRedemption, {
      foreignKey: 'rewardId',
      as: 'redemptions'
    });
  };

  return LoyaltyReward;
}; 