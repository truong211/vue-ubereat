const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Debug log environment variables
console.log('Database Config Variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_USER:', process.env.DB_USER ? 'set' : 'not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'set' : 'not set');
console.log('DB_NAME:', process.env.DB_NAME || 'food3');
console.log('DB_PORT:', process.env.DB_PORT || '3306');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'food3',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: {
      decimalNumbers: true
    }
  }
);

// Add query method for backwards compatibility with direct mysql usage
const query = async (sql, params = []) => {
  try {
    const [results] = await sequelize.query(sql, {
      replacements: params,
      type: Sequelize.QueryTypes.RAW
    });
    return results;
  } catch (error) {
    console.error('Error executing SQL query:', error);
    throw error;
  }
};

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

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Export Sequelize instance and configurations
module.exports = {
  sequelize,
  testConnection,
  paymentConfig,
  Sequelize,
  query // Add the query method for backwards compatibility
};
