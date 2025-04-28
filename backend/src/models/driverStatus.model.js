// filepath: d:\vue-ubereat\backend\src\models\driverStatus.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DriverStatus extends Model {}

DriverStatus.init({
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
  status: {
    type: DataTypes.ENUM('available', 'assigned', 'on_delivery', 'offline'),
    defaultValue: 'offline'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'DriverStatus',
  tableName: 'driver_statuses',
  timestamps: true
});

module.exports = DriverStatus;