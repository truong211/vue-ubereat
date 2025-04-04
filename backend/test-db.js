// Test database connection with our direct SQL setup
require('dotenv').config();
const { pool, query, authenticate } = require('./src/config/database');

async function testDatabase() {
  try {
    // Test authentication
    console.log('Testing database connection...');
    await authenticate();
    
    // Test a simple query
    console.log('Executing a simple query...');
    const result = await query('SELECT 1 + 1 as result');
    console.log('Query result:', result);
    
    // Test a query to get users
    console.log('Fetching users...');
    const users = await query('SELECT id, username, email, role FROM users LIMIT 5');
    console.log('Users found:', users.length);
    console.log('User sample:', users.map(u => ({ id: u.id, username: u.username, role: u.role })));
    
    console.log('Database connection and queries are working properly!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing database:', error);
    process.exit(1);
  }
}

testDatabase(); 