// filepath: d:\vue-ubereat\backend\models\loyaltyReferral.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const LoyaltyReferral = sequelize.define('LoyaltyReferral', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    referrerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'User who created the referral'
    },
    referrerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email of the person being referred'
    },
    referredUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'New user who signed up via referral (if completed)'
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
      comment: 'Restaurant-specific referral if applicable'
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Unique code for this referral'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when this referral expires'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pointsAwarded: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Points awarded to referrer when completed'
    }
  }, {
    tableName: 'loyalty_referrals',
    timestamps: true,
    indexes: [
      {
        fields: ['referrerId']
      },
      {
        fields: ['referredUserId']
      },
      {
        fields: ['referralCode'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiryDate']
      }
    ]
  });

  LoyaltyReferral.associate = (models) => {
    LoyaltyReferral.belongsTo(models.User, {
      foreignKey: 'referrerId',
      as: 'referrer'
    });
    
    LoyaltyReferral.belongsTo(models.User, {
      foreignKey: 'referredUserId',
      as: 'referredUser'
    });
    
    LoyaltyReferral.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });
  };

  return LoyaltyReferral;
};