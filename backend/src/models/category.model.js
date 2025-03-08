const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');

/**
 * Category Model
 * Represents food categories in the system
 */
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Restaurant,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'categories'
});

// Define associations
Category.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Restaurant.hasMany(Category, { foreignKey: 'restaurantId', as: 'categories' });

module.exports = Category; 