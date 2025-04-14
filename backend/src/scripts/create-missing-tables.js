/**
 * Script to create missing tables and initialize database
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../models');
const { sequelize } = require('../config/database');

async function createMissingTables() {
  try {
    console.log('Starting script to check and create missing tables...');
    
    // Check if notifications table exists
    try {
      await sequelize.query(`
        SELECT 1 FROM notifications LIMIT 1;
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('Notifications table exists!');
    } catch (error) {
      if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
        console.log('Notifications table does not exist. Creating it now...');
        await db.Notification.sync({ force: false });
        console.log('Notifications table created successfully!');
      } else {
        throw error;
      }
    }
    
    // Check if promotions table exists
    try {
      await sequelize.query(`
        SELECT 1 FROM promotions LIMIT 1;
      `, { type: sequelize.QueryTypes.SELECT });
      console.log('Promotions table exists!');
    } catch (error) {
      if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
        console.log('Promotions table does not exist. Creating it now...');
        await db.Promotion.sync({ force: false });
        console.log('Promotions table created successfully!');
        
        // Create initial promotions
        await db.Promotion.create({
          code: 'WELCOME',
          title: 'Welcome Discount',
          description: 'Get 15% off your first order',
          discountType: 'percentage',
          discountValue: 15,
          minOrderAmount: 200000,
          maxDiscountAmount: 50000,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          isActive: true,
          usageLimit: 1000,
          perUserLimit: 1,
          userRestrictions: 'new_users'
        });
        console.log('Created initial promotion.');
      } else {
        throw error;
      }
    }
    
    // Check for other required tables and create them if missing
    const tables = ['user_favorites', 'user_addresses', 'payment_methods', 'settings'];
    
    for (const table of tables) {
      try {
        await sequelize.query(`
          SELECT 1 FROM ${table} LIMIT 1;
        `, { type: sequelize.QueryTypes.SELECT });
        console.log(`${table} table exists!`);
      } catch (error) {
        if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
          console.log(`${table} table does not exist. Skipping for now.`);
          // We'll handle specific tables as needed
        } else {
          console.error(`Error checking ${table} table:`, error);
        }
      }
    }
    
    // Create the UserFavorites table if needed
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          itemId INT NOT NULL,
          type ENUM('food', 'restaurant', 'category') NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY favorite_user_item_type (userId, itemId, type)
        )
      `);
      console.log('Checked/created user_favorites table');
    } catch (error) {
      console.error('Error creating user_favorites table:', error);
    }
    
    // Create user_address_links if needed
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS user_address_links (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          addressId INT NOT NULL,
          type ENUM('home', 'work', 'other') DEFAULT 'home',
          isDefault BOOLEAN DEFAULT FALSE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (addressId) REFERENCES addresses(id) ON DELETE CASCADE,
          UNIQUE KEY user_address (userId, addressId)
        )
      `);
      console.log('Checked/created user_address_links table');
    } catch (error) {
      console.error('Error creating user_address_links table:', error);
    }
    
    // Check and update notifications schema if needed
    try {
      // We already created the table if it didn't exist, so we're sure it exists now
      // Just need to verify the columns exist, and add them if they don't
      
      // Check for isSystemWide column
      const isSystemWideColumn = await sequelize.query(`
        SHOW COLUMNS FROM notifications LIKE 'isSystemWide'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (isSystemWideColumn.length === 0) {
        console.log('Adding isSystemWide column to notifications table...');
        await sequelize.query(`
          ALTER TABLE notifications ADD COLUMN isSystemWide BOOLEAN DEFAULT FALSE
        `);
        console.log('Added isSystemWide column to notifications table');
      }
      
      // Check for validUntil column
      const validUntilColumn = await sequelize.query(`
        SHOW COLUMNS FROM notifications LIKE 'validUntil'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (validUntilColumn.length === 0) {
        console.log('Adding validUntil column to notifications table...');
        await sequelize.query(`
          ALTER TABLE notifications ADD COLUMN validUntil DATETIME
        `);
        console.log('Added validUntil column to notifications table');
      }
      
      // Check if userId is nullable (which it should be for system notifications)
      const userIdColumn = await sequelize.query(`
        SELECT COLUMN_NAME, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'notifications' AND COLUMN_NAME = 'userId'
      `, { type: sequelize.QueryTypes.SELECT });
      
      if (userIdColumn.length > 0 && userIdColumn[0].IS_NULLABLE === 'NO') {
        console.log('Modifying userId column to allow NULL values...');
        await sequelize.query(`
          ALTER TABLE notifications MODIFY userId INT NULL
        `);
        console.log('Modified userId column to allow NULL values');
      } else {
        console.log('userId column already allows NULL values');
      }
      
    } catch (error) {
      console.error('Error updating notifications schema:', error);
    }
    
    console.log('All database checks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating missing tables:', error);
    process.exit(1);
  }
}

// Run the createMissingTables function
createMissingTables(); 