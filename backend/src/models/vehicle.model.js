// filepath: d:\vue-ubereat\backend\src\models\vehicle.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Vehicle extends Model {}

Vehicle.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('motorcycle', 'car', 'bicycle', 'scooter'),
    allowNull: false,
    defaultValue: 'motorcycle'
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licensePlate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manufacturingYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  documentVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  insuranceExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Vehicle',
  tableName: 'vehicles',
  timestamps: true
});

module.exports = Vehicle;