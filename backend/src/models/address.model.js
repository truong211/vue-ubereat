const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

/**
 * Address Model
 * Represents user delivery addresses in the system
 */
const Address = sequelize.define('Address', {
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
  addressLine1: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  addressLine2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ward: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Vietnam'
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type: {
    type: DataTypes.ENUM('home', 'work', 'other'),
    defaultValue: 'home'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  placeId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Google Maps or other map provider place ID'
  },
  formattedAddress: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Fully formatted address from map provider'
  },
  hasElevator: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  apartmentNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  deliveryNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes for delivery, e.g., doorbell not working'
  },
  contactName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'addresses',
  indexes: [
    {
      fields: ['userId'],
      name: 'idx_address_user'
    },
    {
      fields: ['latitude', 'longitude'],
      name: 'idx_address_location'
    }
  ]
});

// Define associations
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });

module.exports = Address; 