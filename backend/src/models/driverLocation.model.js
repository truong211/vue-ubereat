const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DriverLocation extends Model {}

DriverLocation.init({
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
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  heading: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Direction in degrees from north'
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Speed in meters per second'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'DriverLocation',
  tableName: 'driver_locations',
  timestamps: true,
  updatedAt: true,
  createdAt: false
});

module.exports = DriverLocation;