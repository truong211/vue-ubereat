'use strict';

module.exports = (sequelize, DataTypes) => {
  const StaffPermission = sequelize.define('StaffPermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'staff', 'support'),
      allowNull: false,
      defaultValue: 'staff'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    canView: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    canCreate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    specificPermissions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    grantedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    grantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'staff_permissions',
    timestamps: true
  });

  StaffPermission.associate = function(models) {
    if (models.User) {
      StaffPermission.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      StaffPermission.belongsTo(models.User, {
        foreignKey: 'grantedBy',
        as: 'grantor'
      });
    }
  };

  return StaffPermission;
};