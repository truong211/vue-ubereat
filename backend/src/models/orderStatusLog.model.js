const { DataTypes } = require('sequelize');

/**
 * OrderStatusLog Model
 * Tracks all status changes for orders with timestamps
 */
module.exports = (sequelize, DataTypes) => {
  const OrderStatusLog = sequelize.define('OrderStatusLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders', // Use string table name instead of model reference
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    changedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // Use string table name instead of model reference
        key: 'id'
      },
      comment: 'User who changed the status (null for system changes)'
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true,
      comment: 'Geographic location where status was updated (for delivery tracking)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data about the status change (ETA, driver info, etc.)'
    }
  }, {
    timestamps: true,
    tableName: 'order_status_logs',
    indexes: [
      {
        name: 'order_status_log_idx',
        fields: ['orderId', 'createdAt']
      }
    ]
  });

  // Define associations
  OrderStatusLog.associate = function(models) {
    if (models.Order) {
      OrderStatusLog.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    } else {
      console.warn('Order model not found when associating OrderStatusLog model');
    }

    if (models.User) {
      OrderStatusLog.belongsTo(models.User, { foreignKey: 'changedById', as: 'changedBy' });
    } else {
      console.warn('User model not found when associating OrderStatusLog model');
    }

    // This association is defined in Order model as well, may cause conflicts
    // models.Order.hasMany(OrderStatusLog, { foreignKey: 'orderId', as: 'statusLogs' });
  };

  return OrderStatusLog;
};