const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'food_delivery', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || '123456', 
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize; 