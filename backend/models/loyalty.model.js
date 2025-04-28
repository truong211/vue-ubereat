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
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'restaurants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'vip'),
      defaultValue: 'bronze',
      comment: 'Customer loyalty tier'
    },
    lastPointEarned: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pointsLifetime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total points earned over lifetime (never decreases)'
    },
    lastTierUpgrade: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of last tier upgrade'
    },
    pointsToExpire: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Points scheduled to expire in next 30 days'
    },
    nextExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Next date when points will expire'
    },
    preferredRewardCategories: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'JSON string of preferred reward categories'
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
    tableName: 'loyalty',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['restaurantId']
      },
      {
        fields: ['tier']
      },
      {
        fields: ['lastPointEarned']
      },
      {
        fields: ['nextExpiryDate']
      }
    ]
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
        model: 'restaurants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
        min: 0
      }
    },
    rewardType: {
      type: DataTypes.ENUM('discount', 'free_item', 'delivery_fee', 'special_offer', 'tier_upgrade', 'birthday', 'milestone', 'anniversary'),
      allowNull: false
    },
    rewardValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Value depends on rewardType (e.g. percentage discount)'
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'vip', 'all'),
      defaultValue: 'all',
      comment: 'Minimum tier required to redeem'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'scheduled', 'expired'),
      defaultValue: 'active'
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Start date for reward availability'
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'End date for reward availability'
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    maxRedemptionsPerUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum times a user can redeem this reward'
    },
    totalAvailable: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total number of rewards available'
    },
    totalRedeemed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of times redeemed'
    },
    autoApply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Automatically apply this reward when conditions are met'
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
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
    tableName: 'loyalty_rewards',
    indexes: [
      {
        fields: ['restaurantId']
      },
      {
        fields: ['tier']
      },
      {
        fields: ['status']
      },
      {
        fields: ['validFrom']
      },
      {
        fields: ['validUntil']
      },
      {
        fields: ['rewardType']
      }
    ]
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
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    rewardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loyalty_rewards',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    pointsSpent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status: {
      type: DataTypes.ENUM('issued', 'redeemed', 'used', 'expired', 'cancelled'),
      defaultValue: 'redeemed'
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the reward was actually used'
    },
    autoRedeemed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If true, system automatically redeemed this reward'
    },
    redemptionCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Code to redeem reward at restaurant'
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User feedback about this reward'
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
    tableName: 'loyalty_redemptions',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['rewardId']
      },
      {
        fields: ['orderId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiryDate']
      },
      {
        fields: ['redemptionCode'],
        unique: true,
        where: {
          redemptionCode: {
            [sequelize.Op.ne]: null
          }
        }
      }
    ]
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
    
    // Loyalty has many activities
    Loyalty.hasMany(models.LoyaltyActivity, {
      foreignKey: 'userId',
      sourceKey: 'userId',
      as: 'activities'
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