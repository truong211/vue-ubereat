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
  }
}, {
  timestamps: true,
  tableName: 'addresses'
});

// Define associations
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });

module.exports = Address; 