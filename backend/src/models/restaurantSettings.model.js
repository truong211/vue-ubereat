const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RestaurantSettings extends Model {
    static associate(models) {
      console.log('Available models in RestaurantSettings.associate:', Object.keys(models));
      const { Restaurant } = models;

      // Simplified association setup
      if (Restaurant) {
        this.belongsTo(Restaurant, {
          foreignKey: 'restaurantId',
          as: 'restaurant',
          onDelete: 'CASCADE'
        });
        console.log('RestaurantSettings-Restaurant association set up');
      } else {
        console.error('Restaurant model is missing for RestaurantSettings association');
      }
    }
  }

  RestaurantSettings.init({
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
    isOpen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    availabilityStatus: {
      type: DataTypes.ENUM('online', 'busy', 'offline', 'temporarily_closed'),
      allowNull: false,
      defaultValue: 'online'
    },
    busyLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    estimatedPrepTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    statusMessage: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    autoOfflineThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    acceptingOrders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'RestaurantSettings',
    tableName: 'restaurant_settings',
    timestamps: true
  });

  return RestaurantSettings;
};