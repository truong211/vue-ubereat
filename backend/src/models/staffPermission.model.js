const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

/**
 * StaffPermission Model
 * Manages permissions for staff accounts (drivers, restaurant staff, admin)
 */
const StaffPermission = sequelize.define('StaffPermission', {
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
  // Order management permissions
  canViewOrders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Can view orders'
  },
  canManageOrders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can update order status, edit orders'
  },
  canCancelOrders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can cancel orders'
  },
  canAssignDrivers: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can assign drivers to orders'
  },
  // Delivery management permissions
  canViewDeliveries: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Can view delivery information'
  },
  canManageDeliveries: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can update delivery status, edit delivery details'
  },
  // Restaurant permissions (for restaurant staff)
  canManageMenu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can manage restaurant menu items'
  },
  canManageRestaurantSettings: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can manage restaurant settings'
  },
  // Admin permissions
  canManageUsers: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can manage user accounts'
  },
  canManageSettings: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Can manage system settings'
  },
  // Permission group - predefined sets of permissions
  permissionGroup: {
    type: DataTypes.ENUM('basic', 'standard', 'manager', 'admin'),
    defaultValue: 'basic',
    comment: 'Predefined permission groups'
  },
  // Custom permissions (JSON field for future expansion)
  customPermissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'staff_permissions',
  indexes: [
    {
      unique: true,
      fields: ['userId']
    }
  ]
});

// Define associations
StaffPermission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(StaffPermission, { foreignKey: 'userId', as: 'permissions' });

module.exports = StaffPermission; 