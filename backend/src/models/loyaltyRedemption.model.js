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
      allowNull: false
    },
    rewardId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pointsSpent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    timestamps: true,
    underscored: true,
    sync: {
      alter: false,
      force: false
    }
  });

  // Define associations
  LoyaltyRedemption.associate = function(models) {
    LoyaltyRedemption.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: false
    });
    
    LoyaltyRedemption.belongsTo(models.LoyaltyReward, {
      foreignKey: 'rewardId',
      as: 'reward',
      targetKey: 'id',
      constraints: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    LoyaltyRedemption.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order',
      constraints: false
    });
  };

  return LoyaltyRedemption;
};