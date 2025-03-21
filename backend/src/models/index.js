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

// Define additional relationships
User.hasMany(UserActivityLog, { foreignKey: 'userId' });
UserActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MarketingContent, { foreignKey: 'createdBy', as: 'createdContent' });
MarketingContent.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

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
  MarketingContent
};