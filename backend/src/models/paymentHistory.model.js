'use strict';

module.exports = (sequelize, DataTypes) => {
  const PaymentHistory = sequelize.define('PaymentHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    paymentDetails: {
      type: DataTypes.JSON,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'payment_history',
    timestamps: true
  });

  PaymentHistory.associate = function(models) {
    if (models.User) {
      PaymentHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }

    if (models.Order) {
      PaymentHistory.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  };

  return PaymentHistory;
};