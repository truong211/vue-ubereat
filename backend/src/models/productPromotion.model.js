'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductPromotion = sequelize.define('ProductPromotion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed_amount'),
      allowNull: true
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'product_promotions',
    timestamps: true
  });

  ProductPromotion.associate = function(models) {
    if (models.Product) {
      ProductPromotion.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }

    if (models.Promotion) {
      ProductPromotion.belongsTo(models.Promotion, {
        foreignKey: 'promotionId',
        as: 'promotion'
      });
    }
  };

  return ProductPromotion;
};