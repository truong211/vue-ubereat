const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Product = require('./product.model');
const Order = require('./order.model');

/**
 * Review Model
 * Represents customer reviews for restaurants and products
 */
const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Restaurant,
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Product,
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // New fields for additional review features
  moderationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved'
  },
  moderationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  moderatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  moderatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  helpfulVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unhelpfulVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Detailed food-specific ratings
  foodQualityRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  valueRating: {
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
  // Tags/Aspects of the review
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'reviews'
});

// Define associations
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Review.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Review.belongsTo(User, { foreignKey: 'moderatedBy', as: 'moderator' });

// Add reverse associations
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Order.hasMany(Review, { foreignKey: 'orderId', as: 'reviews' });
Restaurant.hasMany(Review, { foreignKey: 'restaurantId', as: 'reviews' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });

module.exports = Review;