const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiPerformanceLog = sequelize.define('ApiPerformanceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  route: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'API route path'
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'HTTP method (GET, POST, etc.)'
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Response time in milliseconds'
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'HTTP status code'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who made the request (if authenticated)'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ApiPerformanceLogs',
  timestamps: true,
  updatedAt: false,
  createdAt: 'timestamp'
});

module.exports = ApiPerformanceLog;