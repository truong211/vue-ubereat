// Import models using direct SQL connections
const UserModel = require('./user.model');
const RestaurantModel = require('./restaurant.model');
const CategoryModel = require('./category.model');
const ProductModel = require('./product.model');
const OrderModel = require('./order.model');
const OrderDetailModel = require('./orderDetail.model');
const ReviewModel = require('./review.model');
const ReviewVoteModel = require('./reviewVote.model');
const ReviewReportModel = require('./reviewReport.model');
const PaymentHistoryModel = require('./paymentHistory.model');
const PromotionModel = require('./promotion.model');
const UserPromotionModel = require('./userPromotion.model');
const ProductPromotionModel = require('./productPromotion.model');
const BannerModel = require('./banner.model');
const StaticPageModel = require('./staticPage.model');
const SiteConfigModel = require('./siteConfig.model');
const FAQModel = require('./faq.model');
const NotificationTrackingModel = require('./notificationTracking.model');
const StaffPermissionModel = require('./staffPermission.model');
const DeliveryConfigModel = require('./deliveryConfig.model.js');

// Import database connection
const { query, pool, authenticate, paymentConfig } = require('../config/database');

// Create db object with all models
const db = {
  User: UserModel,
  Restaurant: RestaurantModel,
  Category: CategoryModel,
  Product: ProductModel,
  Order: OrderModel,
  OrderDetail: OrderDetailModel,
  Review: ReviewModel,
  ReviewVote: ReviewVoteModel,
  ReviewReport: ReviewReportModel,
  PaymentHistory: PaymentHistoryModel,
  Promotion: PromotionModel,
  UserPromotion: UserPromotionModel,
  ProductPromotion: ProductPromotionModel,
  Banner: BannerModel,
  StaticPage: StaticPageModel,
  SiteConfig: SiteConfigModel,
  FAQ: FAQModel,
  NotificationTracking: NotificationTrackingModel,
  StaffPermission: StaffPermissionModel,
  DeliveryConfig: DeliveryConfigModel
};

// Add database connection and utilities
db.query = query;
db.pool = pool;
db.authenticate = authenticate;
db.paymentConfig = paymentConfig;

module.exports = db; 