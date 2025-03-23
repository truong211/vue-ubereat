const User = require('./user.model');
const Review = require('./review.model');
const ReviewVote = require('./reviewVote.model');
const ReviewReport = require('./reviewReport.model');
const Restaurant = require('./restaurant.model');
const Order = require('./order.model');

module.exports = function defineAssociations() {
  // Review associations
  Review.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Review.belongsTo(Restaurant, { as: 'restaurant', foreignKey: 'restaurantId' });
  Review.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
  Review.belongsTo(User, { as: 'moderator', foreignKey: 'moderatedBy' });

  // ReviewVote associations
  ReviewVote.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  ReviewVote.belongsTo(Review, { as: 'review', foreignKey: 'reviewId' });
  Review.hasMany(ReviewVote, { as: 'votes', foreignKey: 'reviewId' });
  User.hasMany(ReviewVote, { as: 'reviewVotes', foreignKey: 'userId' });

  // ReviewReport associations
  ReviewReport.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  ReviewReport.belongsTo(Review, { as: 'review', foreignKey: 'reviewId' });
  ReviewReport.belongsTo(User, { as: 'moderator', foreignKey: 'moderatorId' });
  Review.hasMany(ReviewReport, { as: 'reports', foreignKey: 'reviewId' });
  User.hasMany(ReviewReport, { as: 'reviewReports', foreignKey: 'userId' });

  // Reverse associations
  User.hasMany(Review, { as: 'reviews', foreignKey: 'userId' });
  Restaurant.hasMany(Review, { as: 'reviews', foreignKey: 'restaurantId' });
  Order.hasMany(Review, { as: 'reviews', foreignKey: 'orderId' });

  // Keep track of moderated reviews
  User.hasMany(Review, { as: 'moderatedReviews', foreignKey: 'moderatedBy' });
};