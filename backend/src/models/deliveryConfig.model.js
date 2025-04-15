const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class DeliveryConfig extends Model {
  static associate(models) {
    DeliveryConfig.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });

    DeliveryConfig.hasMany(models.DeliveryFeeTier, {
      foreignKey: 'deliveryConfigId',
      as: 'feeTiers'
    });
  }
}

DeliveryConfig.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'restaurants',
      key: 'id'
    }
  },
  maxDeliveryDistance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 10.0
  },
  minOrderAmountForDelivery: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  baseDeliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  useDistanceBasedFee: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  feePerKilometer: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  freeDeliveryThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'DeliveryConfig',
  tableName: 'delivery_configs',
  timestamps: true
});

module.exports = DeliveryConfig;
