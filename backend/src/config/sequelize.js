const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('../../config/database');

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Determine environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

module.exports = sequelize;