const { DataTypes } = require('sequelize');

/**
 * DriverLocation Model
 * Tracks real-time location of delivery drivers
 */
module.exports = (sequelize, DataTypes) => {
  const DriverLocation = sequelize.define('DriverLocation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use string table name instead of model reference
        key: 'id'
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    heading: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Direction in degrees, 0-360'
    },
    speed: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Speed in km/h'
    },
    accuracy: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'GPS accuracy in meters'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the driver is available for delivery'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'driver_locations',
    indexes: [
      {
        name: 'driver_location_idx',
        fields: ['driverId', 'lastUpdated']
      }
    ]
  });

  // Define associations
  DriverLocation.associate = function(models) {
    if (models.User) {
      DriverLocation.belongsTo(models.User, { foreignKey: 'driverId', as: 'driver' });
      // This association is defined on User model to avoid circular references
      // models.User.hasOne(DriverLocation, { foreignKey: 'driverId', as: 'location' });
    } else {
      console.warn('User model not found when associating DriverLocation model');
    }
  };

  return DriverLocation;
};