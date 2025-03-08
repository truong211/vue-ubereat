const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant.model');

/**
 * Promotion Model
 * Represents discounts and promotions in the system
 */
const Promotion = sequelize.define('Promotion', {
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
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed_amount'),
    allowNull: false
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  minOrderValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  maxDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isGlobal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  applicableProducts: {
    type: DataTypes.JSON,
    allowNull: true
  },
  applicableCategories: {
    type: DataTypes.JSON,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'promotions'
});

// Define associations
Promotion.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Restaurant.hasMany(Promotion, { foreignKey: 'restaurantId', as: 'promotions' });

module.exports = Promotion; 