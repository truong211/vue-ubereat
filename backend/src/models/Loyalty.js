'use strict';

module.exports = (sequelize, DataTypes) => {
  const Loyalty = sequelize.define('Loyalty', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Restaurants',
        key: 'id'
      },
      comment: 'If null, points apply globally across platform'
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'bronze',
      comment: 'Customer loyalty tier'
    },
    lastPointEarned: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'loyalty',
    timestamps: true
  });

  Loyalty.associate = (models) => {
    // Loyalty belongs to a user
    Loyalty.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Loyalty can belong to a specific restaurant
    Loyalty.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });
  };

  return Loyalty;
}; 