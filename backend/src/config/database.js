const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Debug log environment variables
console.log('Database Config Variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_USER:', process.env.DB_USER ? 'set' : 'not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'set' : 'not set');
console.log('DB_NAME:', process.env.DB_NAME || 'food_delivery');
console.log('DB_PORT:', process.env.DB_PORT || '3306');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_delivery',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
};

console.log('Database config:', { 
  host: dbConfig.host, 
  username: dbConfig.username, 
  database: dbConfig.database,
  port: dbConfig.port
});

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
    define: dbConfig.define
  }
);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Payment gateway configurations
const paymentConfig = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    apiUrl: process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create',
    notifyUrl: process.env.MOMO_NOTIFY_URL
  },

  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL
  },

  baseUrl: process.env.BASE_URL || 'http://localhost:3000'
};

// Export the Sequelize instance directly
module.exports = sequelize;
