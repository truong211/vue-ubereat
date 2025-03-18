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
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      Monday: { enabled: true, open: '09:00', close: '22:00' },
      Tuesday: { enabled: true, open: '09:00', close: '22:00' },
      Wednesday: { enabled: true, open: '09:00', close: '22:00' },
      Thursday: { enabled: true, open: '09:00', close: '22:00' },
      Friday: { enabled: true, open: '09:00', close: '22:00' },
      Saturday: { enabled: true, open: '10:00', close: '23:00' },
      Sunday: { enabled: true, open: '10:00', close: '22:00' }
    }
  },
  specialHolidays: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
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
  },
  deliverySettings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      radius: 5, // delivery radius in km
      minOrder: 10,
      baseFee: 2,
      perKmFee: 0.5,
      autoAccept: false,
      pickupEnabled: true
    }
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      email: true,
      sms: true,
      push: true,
      newOrders: true,
      orderUpdates: true,
      reviews: true
    }
  }
}, {
  timestamps: true,
  tableName: 'restaurants'
});

// Define associations
Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

module.exports = Restaurant;