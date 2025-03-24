const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Category = require('./category.model');
const Product = require('./product.model');
const Order = require('./order.model');
const OrderDetail = require('./orderDetail.model');
const Review = require('./review.model');
const ReviewVote = require('./reviewVote.model');
const ReviewReport = require('./reviewReport.model');
const Address = require('./address.model');
const Cart = require('./cart.model');
const PaymentHistory = require('./paymentHistory.model');
const Promotion = require('./promotion.model');
const ProductPromotion = require('./productPromotion.model');
const Banner = require('./banner.model');
const StaticPage = require('./staticPage.model');
const SiteConfig = require('./siteConfig.model');
const UserActivityLog = require('./userActivityLog.model');
const ApiPerformanceLog = require('./apiPerformanceLog.model');
const MarketingContent = require('./marketingContent.model');
const FAQ = require('./faq.model');
const Notification = require('./notification.model');
const NotificationTracking = require('./notificationTracking.model');
const Loyalty = require('./Loyalty');
const LoyaltyReward = require('./LoyaltyReward');
const LoyaltyRedemption = require('./LoyaltyRedemption');
const ReviewResponse = require('./ReviewResponse');
const StaffPermission = require('./staffPermission.model');
const DeliveryConfig = require('./deliveryConfig.model');
const DeliveryFeeTier = require('./deliveryFeeTier.model');

// Define relationships
User.hasMany(UserActivityLog, { foreignKey: 'userId' });
UserActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MarketingContent, { foreignKey: 'createdBy', as: 'createdContent' });
MarketingContent.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Add notification relationships
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(NotificationTracking, { foreignKey: 'userId' });
NotificationTracking.belongsTo(User, { foreignKey: 'userId' });

Notification.hasMany(NotificationTracking, { foreignKey: 'notificationId' });
NotificationTracking.belongsTo(Notification, { foreignKey: 'notificationId' });

// Add loyalty relationships
User.hasMany(Loyalty, { foreignKey: 'userId' });
Loyalty.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Restaurant.hasMany(Loyalty, { foreignKey: 'restaurantId' });
Loyalty.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

Restaurant.hasMany(LoyaltyReward, { foreignKey: 'restaurantId' });
LoyaltyReward.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

LoyaltyReward.hasMany(LoyaltyRedemption, { foreignKey: 'rewardId' });
LoyaltyRedemption.belongsTo(LoyaltyReward, { foreignKey: 'rewardId', as: 'reward' });

User.hasMany(LoyaltyRedemption, { foreignKey: 'userId' });
LoyaltyRedemption.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(LoyaltyRedemption, { foreignKey: 'orderId' });
LoyaltyRedemption.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Add review response relationships
Review.hasOne(ReviewResponse, { foreignKey: 'reviewId' });
ReviewResponse.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });

Restaurant.hasMany(ReviewResponse, { foreignKey: 'restaurantId' });
ReviewResponse.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

User.hasMany(ReviewResponse, { foreignKey: 'respondedBy' });
ReviewResponse.belongsTo(User, { foreignKey: 'respondedBy', as: 'responder' });

// Add staff permission relationships
User.hasOne(StaffPermission, { foreignKey: 'userId', as: 'permissions' });
StaffPermission.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Add delivery config relationships
Restaurant.hasOne(DeliveryConfig, { foreignKey: 'restaurantId', as: 'deliveryConfig' });
DeliveryConfig.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

DeliveryConfig.hasMany(DeliveryFeeTier, { foreignKey: 'deliveryConfigId', as: 'feeTiers' });
DeliveryFeeTier.belongsTo(DeliveryConfig, { foreignKey: 'deliveryConfigId', as: 'deliveryConfig' });

module.exports = {
  User,
  Restaurant,
  Category,
  Product,
  Order,
  OrderDetail,
  Review,
  ReviewVote,
  ReviewReport,
  Address,
  Cart,
  PaymentHistory,
  Promotion,
  ProductPromotion,
  Banner,
  StaticPage,
  SiteConfig,
  UserActivityLog,
  ApiPerformanceLog,
  MarketingContent,
  FAQ,
  Notification,
  NotificationTracking,
  Loyalty,
  LoyaltyReward,
  LoyaltyRedemption,
  ReviewResponse,
  StaffPermission,
  DeliveryConfig,
  DeliveryFeeTier
};