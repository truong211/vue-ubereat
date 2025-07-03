'use strict';

// No need for Sequelize anymore
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const db = {};

// Import models directly
db.Article = require('./article');
db.Restaurant = require('../src/models/restaurant.model');
db.User = require('../src/models/user.model');
db.Category = require('../src/models/category.model');
db.Product = require('../src/models/product.model');
db.Order = require('../src/models/order.model');
db.OrderDetail = require('../src/models/orderDetail.model');
db.Review = require('../src/models/review.model');
db.ReviewVote = require('../src/models/reviewVote.model');
db.ReviewReport = require('../src/models/reviewReport.model');
db.PaymentHistory = require('../src/models/paymentHistory.model');
db.UserPromotion = require('../src/models/userPromotion.model');
db.Promotion = require('../src/models/promotion.model');
db.ProductPromotion = require('../src/models/productPromotion.model');
db.Banner = require('../src/models/banner.model');
db.StaticPage = require('../src/models/staticPage.model');
db.SiteConfig = require('../src/models/siteConfig.model');
db.FAQ = require('../src/models/faq.model');
db.NotificationTracking = require('../src/models/notificationTracking.model');
db.StaffPermission = require('../src/models/staffPermission.model');
db.DeliveryConfig = require('../src/models/deliveryConfig.model');
// Add other models as they're converted to use direct SQL
// db.Notification = require('./notification');
// db.ReviewResponse = require('./reviewResponse');

db.UserProfile = require('./userProfile');
db.Address = require('./address');

// Note: As you convert more models from Sequelize to SQL,
// uncomment the lines above and add them to this file.

// Add database connections and utilities
const { pool, query, authenticate, paymentConfig } = require('../src/config/database');
db.pool = pool;
db.query = query;
db.authenticate = authenticate;
db.paymentConfig = paymentConfig;

module.exports = db;