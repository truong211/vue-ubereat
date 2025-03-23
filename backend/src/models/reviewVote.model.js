const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Review = require('./review.model');

class ReviewVote extends Model {}

ReviewVote.init({
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
  reviewId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Reviews',
      key: 'id'
    }
  },
  isHelpful: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ReviewVote',
  tableName: 'ReviewVotes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'reviewId']
    }
  ]
});

// Define associations
ReviewVote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ReviewVote.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });

// Add reverse associations
User.hasMany(ReviewVote, { foreignKey: 'userId', as: 'reviewVotes' });
Review.hasMany(ReviewVote, { foreignKey: 'reviewId', as: 'votes' });

module.exports = ReviewVote;