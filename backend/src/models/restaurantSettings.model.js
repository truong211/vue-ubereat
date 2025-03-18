const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RestaurantSettings = sequelize.define('RestaurantSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Restaurants',
        key: 'id',
      },
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    availabilityStatus: {
      type: DataTypes.ENUM('online', 'busy', 'offline', 'temporarily_closed'),
      allowNull: false,
      defaultValue: 'online',
    },
    busyLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Busy level from 1-5, with 5 being extremely busy',
    },
    estimatedPrepTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Current estimated food preparation time in minutes',
    },
    statusMessage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Optional message to display about the current status',
    },
    autoOfflineThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of pending orders that triggers auto-busy status',
    },
    acceptingOrders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'restaurant_settings',
    timestamps: true,
  });

  RestaurantSettings.associate = (models) => {
    RestaurantSettings.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      onDelete: 'CASCADE',
    });
  };

  return RestaurantSettings;
};