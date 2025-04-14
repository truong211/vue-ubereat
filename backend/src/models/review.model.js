const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      if (!models) {
        console.error('No models object provided to Review.associate');
        return;
      }

      const { User, Restaurant, Order, ReviewVote } = models;

      if (User) {
        this.belongsTo(User, {
          foreignKey: 'userId',
          as: 'user',
          onDelete: 'CASCADE'
        });
      }

      if (Restaurant) {
        this.belongsTo(Restaurant, {
          foreignKey: 'restaurantId',
          as: 'restaurant',
          onDelete: 'CASCADE'
        });
      }

      if (Order) {
        this.belongsTo(Order, {
          foreignKey: 'orderId',
          as: 'order',
          onDelete: 'CASCADE'
        });
      }

      if (ReviewVote) {
        this.hasMany(ReviewVote, {
          foreignKey: 'reviewId',
          as: 'votes',
          onDelete: 'CASCADE'
        });
      }
    }

    static async findByPkWithDetails(id) {
      return await this.findByPk(id, {
        include: [
          { model: sequelize.models.User, as: 'user', attributes: ['id', 'name'] },
          { model: sequelize.models.Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: sequelize.models.Product, as: 'product', attributes: ['id', 'name'] }
        ]
      });
    }
  }

  Review.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,  // Changed to true to allow SET NULL on delete
      unique: true,
      references: {
        model: 'orders',
        key: 'id'
      },
      onDelete: 'SET NULL'  // Explicitly set the onDelete behavior
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    foodRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    serviceRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    deliveryRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    responseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unhelpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        name: 'idx_review_restaurant',
        fields: ['restaurantId']
      },
      {
        name: 'idx_review_user',
        fields: ['userId']
      },
      {
        name: 'idx_review_order',
        fields: ['orderId']
      }
    ]
  });

  return Review;
};
