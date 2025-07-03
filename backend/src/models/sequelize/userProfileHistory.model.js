'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

class UserProfileHistory extends Model {}

UserProfileHistory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    field: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    old_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    changed_by_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UserProfileHistory',
    tableName: 'user_profile_history',
    timestamps: false, // already have changed_at
    underscored: true,
  }
);

module.exports = UserProfileHistory;