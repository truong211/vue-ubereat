const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

/**
 * Restaurant Model
 * Represents restaurants in the system
 */
const Restaurant = sequelize.define('Restaurant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
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
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  openingHours: {
    type: DataTypes.JSON,
    allowNull: true
  },
  cuisineType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  priceRange: {
    type: DataTypes.ENUM('$', '$$', '$$$', '$$$$'),
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  estimatedDeliveryTime: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'restaurants'
});

// Define associations
Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

module.exports = Restaurant; 