const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Review = require('./review.model');

const ReviewVote = sequelize.define('ReviewVote', {
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
  reviewId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Review,
      key: 'id'
    }
  },
  isHelpful: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'review_votes',
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