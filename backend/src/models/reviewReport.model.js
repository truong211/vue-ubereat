const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Review = require('./review.model');

const ReviewReport = sequelize.define('ReviewReport', {
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
  reason: {
    type: DataTypes.ENUM('inappropriate', 'spam', 'fake', 'offensive', 'other'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true,
  tableName: 'review_reports',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'reviewId']
    }
  ]
});

// Define associations
ReviewReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ReviewReport.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });

// Add reverse associations
User.hasMany(ReviewReport, { foreignKey: 'userId', as: 'reviewReports' });
Review.hasMany(ReviewReport, { foreignKey: 'reviewId', as: 'reports' });

module.exports = ReviewReport;