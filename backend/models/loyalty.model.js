'use strict';

module.exports = (sequelize, DataTypes) => {
  const Loyalty = sequelize.define('Loyalty', {
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
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Restaurants',
        key: 'id'
      },
      comment: 'If null, points apply globally across platform'
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'bronze',
      comment: 'Customer loyalty tier'
    },
    lastPointEarned: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'loyalty'
  });

  // Define a model for loyalty rewards
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
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'loyalty_rewards'
  });

  // Define a model for loyalty reward redemptions
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
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'loyalty_redemptions'
  });

  Loyalty.associate = (models) => {
    // Loyalty belongs to a user
    Loyalty.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Loyalty can belong to a specific restaurant
    Loyalty.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });
  };

  LoyaltyReward.associate = (models) => {
    // Reward can belong to a specific restaurant
    LoyaltyReward.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });

    // Reward has many redemptions
    LoyaltyReward.hasMany(LoyaltyRedemption, {
      foreignKey: 'rewardId',
      as: 'redemptions'
    });
  };

  LoyaltyRedemption.associate = (models) => {
    // Redemption belongs to a user
    LoyaltyRedemption.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Redemption belongs to a reward
    LoyaltyRedemption.belongsTo(LoyaltyReward, {
      foreignKey: 'rewardId',
      as: 'reward'
    });

    // Redemption can be associated with an order
    LoyaltyRedemption.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
  };

  return {
    Loyalty,
    LoyaltyReward,
    LoyaltyRedemption
  };
}; 