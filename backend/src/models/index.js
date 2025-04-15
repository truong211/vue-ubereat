/**
 * Models Index File
 */

const { Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Order = require('./order.model');
const Product = require('./product.model');
const Category = require('./category.model');
const Review = require('./review.model');
const SiteConfig = require('./siteConfig.model');
const Banner = require('./banner.model');
const DeliveryConfig = require('./deliveryConfig.model');
const DeliveryFeeTier = require('./deliveryFeeTier.model');
const Cart = require('./cart.model');
const Address = require('./address.model');
const Promotion = require('./promotion.model');
const StaticPage = require('./staticPage.model');
const Notification = require('./notification.model');
const NotificationSubscription = require('./notificationSubscription.model');
const OrderItem = require('./orderItem.model');

// Initialize models object
const models = {
  User,
  Restaurant,
  Order,
  Product,
  Category,
  Review,
  SiteConfig,
  Banner,
  DeliveryConfig,
  DeliveryFeeTier,
  Cart,
  Address,
  Promotion,
  StaticPage,
  Notification,
  NotificationSubscription,
  OrderItem
};

// Set up associations
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

// Function to sync database tables in sequence
const syncDatabase = async () => {
  try {
    // Drop existing notification tables if they exist
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('DROP TABLE IF EXISTS notifications');
    await sequelize.query('DROP TABLE IF EXISTS notification_subscriptions');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create notification tables with proper schema
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_system_wide BOOLEAN DEFAULT false,
        is_read BOOLEAN DEFAULT false,
        read_at DATETIME,
        valid_until DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notification_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        subscription TEXT NOT NULL,
        user_agent VARCHAR(255),
        active BOOLEAN DEFAULT true,
        last_used DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Sync all models except Notification and NotificationSubscription
    const modelArray = Object.values(models).filter(model => 
      model.prototype instanceof Model && 
      model !== Notification && 
      model !== NotificationSubscription
    );

    for (const model of modelArray) {
      await model.sync({ force: false, alter: false });
    }
    
    console.log('Database & tables synced');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

// Execute sync
syncDatabase();

module.exports = models; 