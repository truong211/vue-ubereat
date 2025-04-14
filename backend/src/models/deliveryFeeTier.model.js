/**
 * DeliveryFeeTier model with Sequelize implementation
 */
module.exports = (sequelize, DataTypes) => {
  const DeliveryFeeTier = sequelize.define('DeliveryFeeTier', {
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Minimum distance in kilometers for this tier'
    },
    maxDistance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Maximum distance in kilometers for this tier'
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Delivery fee for this distance tier'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional description of this tier'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'delivery_fee_tiers',
    timestamps: true,
    indexes: [
      {
        fields: ['deliveryConfigId', 'minDistance'],
        name: 'idx_delivery_fee_tier_config_distance'
      }
    ]
  });

  // Associations
  DeliveryFeeTier.associate = (models) => {
    if (models.DeliveryConfig) {
      DeliveryFeeTier.belongsTo(models.DeliveryConfig, {
        foreignKey: 'deliveryConfigId',
        as: 'deliveryConfig'
      });
    } else {
      console.warn('DeliveryConfig model not found when associating DeliveryFeeTier model');
    }
  };

  // Class methods
  DeliveryFeeTier.createTiers = async function(dataArray) {
    return await this.bulkCreate(dataArray);
  };

  return DeliveryFeeTier;
};
