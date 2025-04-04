/**
 * Simple test script to verify database connection and API functionality
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log
  }
);

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Try a simple query
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Database query successful:');
    console.log(results);
    
    console.log('\nDatabase connection is working properly.');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run the test
testConnection(); 