const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  }
}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for system-wide notifications
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_system_wide: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_system_wide'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'valid_until'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Notification;