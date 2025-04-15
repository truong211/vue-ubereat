const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class DeliveryFeeTier extends Model {
  static associate(models) {
    DeliveryFeeTier.belongsTo(models.DeliveryConfig, {
      foreignKey: 'deliveryConfigId',
      as: 'deliveryConfig'
    });
  }
}

DeliveryFeeTier.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deliveryConfigId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'delivery_configs',
      key: 'id'
    }
  },
  minDistance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  maxDistance: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'DeliveryFeeTier',
  tableName: 'delivery_fee_tiers',
  timestamps: true
});

module.exports = DeliveryFeeTier; 