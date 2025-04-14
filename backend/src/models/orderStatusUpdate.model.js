'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderStatusUpdate = sequelize.define('OrderStatusUpdate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    oldStatus: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who updated the status'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isSystemUpdate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'order_status_updates',
    timestamps: true
  });

  OrderStatusUpdate.associate = function(models) {
    if (models.Order) {
      OrderStatusUpdate.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }

    if (models.User) {
      OrderStatusUpdate.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });
    }
  };

  return OrderStatusUpdate;
};