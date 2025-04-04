const mysql = require('mysql2');
const util = require('util');
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
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_delivery',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectTimeout: 60000, // Increase timeout for slower connections
};

console.log('Database config:', { 
  host: dbConfig.host, 
  user: dbConfig.user, 
  database: dbConfig.database,
  port: dbConfig.port
});

// Create a MySQL connection pool
const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  multipleStatements: true,
  typeCast: function (field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return (field.string() === '1'); // Convert TINYINT(1) to boolean
    }
    return next();
  }
});

// Get the promise-based pool to use async/await
const promisePool = pool.promise();

// Log connection errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Log when connections are made (optional)
pool.on('connection', () => {
  console.log('New database connection established');
});

// Log when connections are released (optional)
// Comment out or conditionally log to reduce console output
// pool.on('release', () => {
//   console.log('Database connection released');
// });

// Alternative: Only log in debug mode
pool.on('release', () => {
  if (process.env.DEBUG === 'true') {
    console.log('Database connection released');
  }
});

// Properly promisify the query method
const query = async (sql, params = []) => {
  try {
    const [results] = await promisePool.query(sql, params);
    return processResults(results);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Function to verify database connection
const authenticate = async () => {
  try {
    // Execute a simple query to check connection
    await query('SELECT 1 + 1 AS result');
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Process query results to handle JSON fields
const processResults = (results) => {
  if (!results || typeof results !== 'object') return results;
  
  // Handle single object or array of objects
  const items = Array.isArray(results) ? results : [results];
  
  items.forEach(item => {
    // Check each field to see if it's a JSON string
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'string') {
        try {
          if (item[key].startsWith('{') || item[key].startsWith('[')) {
            const parsed = JSON.parse(item[key]);
            item[key] = parsed;
          }
        } catch (e) {
          // Not valid JSON, keep as is
        }
      }
    });
  });
  
  return Array.isArray(results) ? items : items[0];
};

// Helper function for transactions
const transaction = async (callback) => {
  let connection;
  try {
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });
    
    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const result = await callback(connection);
    
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return result;
  } catch (error) {
    if (connection) {
      await new Promise(resolve => {
        connection.rollback(() => resolve());
      });
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
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

// Export the main database connection and helpers
const db = {
  query,
  authenticate,
  transaction,
  processResults,
  paymentConfig
};

// Model-like functions to make transition from Sequelize easier
db.users = {
  findByPk: async (id) => await query('SELECT * FROM users WHERE id = ?', [id]),
  findOne: async (where) => {
    const whereClause = Object.entries(where).map(([key, value]) => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    const results = await query(`SELECT * FROM users WHERE ${whereClause} LIMIT 1`, values);
    return results[0];
  },
  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM users';
    const values = [];
    
    if (options.where) {
      const whereClause = Object.entries(options.where).map(([key, value]) => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(options.where));
    }
    
    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit)}`;
    }
    
    return await query(sql, values);
  },
  create: async (data) => {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const result = await query(`INSERT INTO users (${columns}) VALUES (${placeholders})`, values);
    return { id: result.insertId, ...data };
  },
  update: async (data, options) => {
    const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data)];
    
    let sql = `UPDATE users SET ${setClauses}`;
    
    if (options.where) {
      const whereClause = Object.entries(options.where).map(([key, value]) => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(options.where));
    }
    
    const result = await query(sql, values);
    return [result.affectedRows, undefined];
  },
  destroy: async (options) => {
    let sql = 'DELETE FROM users';
    const values = [];
    
    if (options.where) {
      const whereClause = Object.entries(options.where).map(([key, value]) => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(options.where));
    }
    
    const result = await query(sql, values);
    return result.affectedRows;
  }
};

module.exports = db;
