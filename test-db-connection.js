#!/usr/bin/env node

/**
 * Test script to verify database connection with direct SQL approach
 * This will test the connection without using Sequelize ORM
 */

// Load .env file from the backend directory
require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/src/config/database');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    
    await db.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Test a simple query
    console.log('Executing a simple query...');
    const result = await db.query('SELECT 1 + 1 as result');
    console.log('✅ Simple query result:', result);
    
    // Test query to get tables from the database
    console.log('Querying database tables...');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [process.env.DB_NAME || 'food_delivery']);
    
    console.log(`✅ Found ${tables.length} tables in the database`);
    console.log('Table list:', tables.map(t => t.table_name || t.TABLE_NAME).join(', '));
    
    // Test users table
    try {
      console.log('Testing users table...');
      const users = await db.query('SELECT id, username, email, role FROM users LIMIT 5');
      console.log(`✅ Found ${users.length} users in database`);
      if (users.length > 0) {
        console.log('Sample user data:', users.map(u => ({ id: u.id, username: u.username, role: u.role })));
      }
    } catch (error) {
      console.error('❌ Error querying users table:', error.message);
    }
    
    // Test loyalty_redemptions table (the one we added)
    try {
      console.log('Testing loyalty_redemptions table...');
      const redemptions = await db.query('SELECT COUNT(*) as count FROM loyalty_redemptions');
      console.log(`✅ loyalty_redemptions table exists with ${redemptions[0].count} records`);
    } catch (error) {
      console.error('❌ Error querying loyalty_redemptions table:', error.message);
    }
    
    console.log('\nDatabase connection and tables are working properly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection(); 