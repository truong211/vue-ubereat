'use strict';

// Create a unified model interface
const db = {};

// Import Sequelize models from src/models
const User = require('../src/models/user.model');
const Restaurant = require('../src/models/restaurant.model');
const Order = require('../src/models/order.model');
const Product = require('../src/models/product.model');
const Category = require('../src/models/category.model');
const Review = require('../src/models/review.model');
const SiteConfig = require('../src/models/siteConfig.model');
const Banner = require('../src/models/banner.model');
const DeliveryConfig = require('../src/models/deliveryConfig.model');
const DeliveryFeeTier = require('../src/models/deliveryFeeTier.model');
const Cart = require('../src/models/cart.model');
const Address = require('../src/models/address.model');
const Promotion = require('../src/models/promotion.model');
const StaticPage = require('../src/models/staticPage.model');
const Notification = require('../src/models/notification.model');
const OrderItem = require('../src/models/orderItem.model');
const NotificationPreference = require('../src/models/notificationPreference.model');

// Export models directly, ensuring they use the same name as in src/models/index.js
db.User = User;
db.Restaurant = Restaurant;
db.Order = Order;
db.Product = Product;
db.Category = Category;
db.Review = Review;
db.SiteConfig = SiteConfig;
db.Banner = Banner;
db.DeliveryConfig = DeliveryConfig;
db.DeliveryFeeTier = DeliveryFeeTier;
db.Cart = Cart;
db.Address = Address;
db.Promotion = Promotion;
db.StaticPage = StaticPage;
db.Notification = Notification;
db.OrderItem = OrderItem;
db.NotificationPreference = NotificationPreference;

// Add database connection
const sequelize = require('../src/config/database');
db.sequelize = sequelize;

module.exports = db;