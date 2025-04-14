'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserPromotion = sequelize.define('UserPromotion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('available', 'used', 'expired'),
      defaultValue: 'available'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    additionalData: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'user_promotions',
    timestamps: true
  });

  UserPromotion.associate = function(models) {
    if (models.User) {
      UserPromotion.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    if (models.Promotion) {
      UserPromotion.belongsTo(models.Promotion, {
        foreignKey: 'promotionId',
        as: 'promotion'
      });
    }

    if (models.Order) {
      UserPromotion.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  };

  return UserPromotion;
};