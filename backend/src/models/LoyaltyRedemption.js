'use strict';

module.exports = (sequelize, DataTypes) => {
  const LoyaltyRedemption = sequelize.define('LoyaltyRedemption', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    rewardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'LoyaltyRewards',
        key: 'id'
      }
    },
    pointsSpent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('redeemed', 'used', 'expired', 'cancelled'),
      defaultValue: 'redeemed'
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'loyalty_redemptions',
    timestamps: true
  });

  LoyaltyRedemption.associate = (models) => {
    // Redemption belongs to a user
    LoyaltyRedemption.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Redemption belongs to a reward
    LoyaltyRedemption.belongsTo(models.LoyaltyReward, {
      foreignKey: 'rewardId',
      as: 'reward'
    });

    // Redemption can be associated with an order
    LoyaltyRedemption.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
  };

  return LoyaltyRedemption;
}; 