const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserActivityLog = sequelize.define('UserActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of activity: login, order, profile_update, etc.'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional details about the activity'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'UserActivityLogs',
  timestamps: true,
  updatedAt: false
});

module.exports = UserActivityLog;