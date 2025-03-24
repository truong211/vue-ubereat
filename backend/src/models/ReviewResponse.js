'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReviewResponse = sequelize.define('ReviewResponse', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Reviews',
        key: 'id'
      }
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Restaurants',
        key: 'id'
      }
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    respondedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'Restaurant admin/owner who responded'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'review_responses',
    timestamps: true
  });

  ReviewResponse.associate = (models) => {
    // Response belongs to a review
    ReviewResponse.belongsTo(models.Review, {
      foreignKey: 'reviewId',
      as: 'review'
    });
    
    // Response belongs to a restaurant
    ReviewResponse.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });
    
    // Response belongs to a user (restaurant staff)
    ReviewResponse.belongsTo(models.User, {
      foreignKey: 'respondedBy',
      as: 'responder'
    });
  };

  return ReviewResponse;
}; 