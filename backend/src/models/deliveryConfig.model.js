/**
 * DeliveryConfig model with Sequelize implementation
 */
module.exports = (sequelize, DataTypes) => {
  const DeliveryConfig = sequelize.define('DeliveryConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    baseDeliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    minOrderAmountForDelivery: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    maxDeliveryDistance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Maximum delivery distance in kilometers'
    },
    useDistanceBasedFee: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    feePerKilometer: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    freeDeliveryThreshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Order amount above which delivery is free'
    },
    deliveryTimeEstimate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated delivery time in minutes'
    },
    deliveryType: {
      type: DataTypes.ENUM('restaurant', 'third_party', 'hybrid'),
      defaultValue: 'restaurant',
      comment: 'Who handles the delivery'
    },
    deliveryNotes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'delivery_configs',
    timestamps: true
  });

  // Associations
  DeliveryConfig.associate = (models) => {
    if (models.Restaurant) {
      DeliveryConfig.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
    } else {
      console.warn('Restaurant model not found when associating DeliveryConfig model');
    }

    if (models.DeliveryFeeTier) {
      DeliveryConfig.hasMany(models.DeliveryFeeTier, {
        foreignKey: 'deliveryConfigId',
        as: 'feeTiers'
      });
    } else {
      console.warn('DeliveryFeeTier model not found when associating DeliveryConfig model');
    }
  };

  // Class methods
  DeliveryConfig.getFeeTiers = async function(deliveryConfigId) {
    if (sequelize.models.DeliveryFeeTier) {
      return await sequelize.models.DeliveryFeeTier.findAll({
        where: { deliveryConfigId },
        order: [['minDistance', 'ASC']]
      });
    }
    return [];
  };

  return DeliveryConfig;
};
