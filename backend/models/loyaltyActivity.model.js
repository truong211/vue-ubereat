// filepath: d:\vue-ubereat\backend\models\loyaltyActivity.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const LoyaltyActivity = sequelize.define('LoyaltyActivity', {
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
      onDelete: 'SET NULL'
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Can be positive (earned) or negative (redeemed/expired)'
    },
    activityType: {
      type: DataTypes.ENUM('earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'tier_upgrade', 'tier_reward'),
      allowNull: false,
      defaultValue: 'earned'
    },
    source: {
      type: DataTypes.ENUM('order', 'reward', 'referral', 'manual', 'system', 'promotion'),
      allowNull: false,
      defaultValue: 'manual'
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
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when these points will expire if not used'
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Used for expiry processing'
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Point balance after this activity'
    }
  }, {
    tableName: 'loyalty_activities',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['restaurantId']
      },
      {
        fields: ['activityType']
      },
      {
        fields: ['source']
      },
      {
        fields: ['expiryDate']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  LoyaltyActivity.associate = (models) => {
    LoyaltyActivity.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    LoyaltyActivity.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });
    
    LoyaltyActivity.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
  };

  return LoyaltyActivity;
};