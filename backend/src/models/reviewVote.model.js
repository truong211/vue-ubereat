/**
 * ReviewVote model with Sequelize implementation
 */
module.exports = (sequelize, DataTypes) => {
  const ReviewVote = sequelize.define('ReviewVote', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reviews',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    voteType: {
      type: DataTypes.ENUM('helpful', 'unhelpful'),
      allowNull: false
    }
  }, {
    tableName: 'review_votes',
    timestamps: true,
    indexes: [
      {
        name: 'unique_user_review_vote',
        unique: true,
        fields: ['userId', 'reviewId']
      }
    ]
  });

  ReviewVote.associate = (models) => {
    ReviewVote.belongsTo(models.Review, {
      foreignKey: 'reviewId',
      as: 'review',
      onDelete: 'CASCADE'
    });

    ReviewVote.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Hook to update helpful/unhelpful count on the review
  ReviewVote.afterCreate = async (vote, options) => {
    try {
      const { Review } = sequelize.models;
      const review = await Review.findByPk(vote.reviewId);
      
      if (review) {
        if (vote.voteType === 'helpful') {
          review.helpfulCount += 1;
        } else if (vote.voteType === 'unhelpful') {
          review.unhelpfulCount += 1;
        }
        
        await review.save({ transaction: options.transaction });
      }
    } catch (error) {
      console.error('Error updating review vote counts:', error);
    }
  };

  ReviewVote.afterDestroy = async (vote, options) => {
    try {
      const { Review } = sequelize.models;
      const review = await Review.findByPk(vote.reviewId);
      
      if (review) {
        if (vote.voteType === 'helpful' && review.helpfulCount > 0) {
          review.helpfulCount -= 1;
        } else if (vote.voteType === 'unhelpful' && review.unhelpfulCount > 0) {
          review.unhelpfulCount -= 1;
        }
        
        await review.save({ transaction: options.transaction });
      }
    } catch (error) {
      console.error('Error updating review vote counts after delete:', error);
    }
  };

  return ReviewVote;
};