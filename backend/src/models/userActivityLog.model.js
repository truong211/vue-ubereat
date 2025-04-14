'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserActivityLog = sequelize.define('UserActivityLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'user_activity_logs',
    timestamps: true,
    updatedAt: false
  });

  UserActivityLog.associate = function(models) {
    if (models.User) {
      UserActivityLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return UserActivityLog;
};