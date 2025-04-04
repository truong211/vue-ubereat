const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');
const Category = require('./category.model');

/**
 * Product Model
 * Represents food items in the system
 */
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Restaurant,
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Category,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isVegetarian: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVegan: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isGlutenFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  spicyLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  preparationTime: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'unavailable'),
    defaultValue: 'available'
  },
  isPopular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nutritionalInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  allergens: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'products'
});

// Define associations
Product.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Restaurant.hasMany(Product, { foreignKey: 'restaurantId', as: 'products' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

module.exports = Product; 