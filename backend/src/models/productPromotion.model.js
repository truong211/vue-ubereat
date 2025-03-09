const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./product.model');
const Promotion = require('./promotion.model');

/**
 * ProductPromotion Model
 * Represents the many-to-many relationship between products and promotions
 */
const ProductPromotion = sequelize.define('ProductPromotion', {
  productId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Product,
      key: 'id'
    }
  },
  promotionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Promotion,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'product_promotions'
});

// Define associations
Product.belongsToMany(Promotion, { through: ProductPromotion, foreignKey: 'productId', as: 'promotions' });
Promotion.belongsToMany(Product, { through: ProductPromotion, foreignKey: 'promotionId', as: 'products' });

module.exports = ProductPromotion;