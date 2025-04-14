/**
 * Password Validation Diagnostic Utility
 * This script tests password validation for a specific user and provides detailed diagnostics
 */
require('dotenv').config({ path: '../.env' });

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Read database config from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'food3',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

console.log('Using database configuration:');
console.log(`- Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`- Database: ${dbConfig.database}`);
console.log(`- User: ${dbConfig.username}`);

// Create a Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database, 
  dbConfig.username, 
  dbConfig.password, 
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false
  }
);

// Get command line arguments
const email = process.argv[2];
const passwordToTest = process.argv[3] || '123456aA@'; // Default password to test

if (!email) {
  console.error('Usage: node password-debug.js <email> [passwordToTest]');
  process.exit(1);
}

async function testPasswordValidation() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Find the user by email
    const [user] = await sequelize.query(
      'SELECT id, email, password FROM users WHERE email = ?',
      { 
        replacements: [email],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    console.log('='.repeat(50));
    console.log(`USER DETAILS FOR: ${user.email} (ID: ${user.id})`);
    console.log('='.repeat(50));
    console.log('Stored password hash:', user.password);
    console.log('Hash length:', user.password.length);
    console.log('Hash format identifier:', user.password.substring(0, 7));

    // Check bcrypt version and identifiers
    console.log('\nBCRYPT INFORMATION:');
    console.log('bcrypt version:', bcrypt.version || 'Unknown');
    console.log('Supported hash identifiers: $2a$, $2b$, $2y$');
    
    // Generate a test hash with the same password for comparison
    const testHash = await bcrypt.hash(passwordToTest, 12);
    console.log('\nNEWLY GENERATED HASH FOR COMPARISON:');
    console.log('Test password:', passwordToTest);
    console.log('Generated test hash:', testHash);
    console.log('Test hash format identifier:', testHash.substring(0, 7));
    
    // Try multiple validation approaches
    console.log('\nMULTIPLE VALIDATION TESTS:');
    
    // Test 1: Standard async compare
    try {
      console.log('\nTest 1: Standard async compare');
      const isValidAsync = await bcrypt.compare(passwordToTest, user.password);
      console.log('Result:', isValidAsync ? 'SUCCESS ✅' : 'FAILED ❌');
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Test 2: Sync compare
    try {
      console.log('\nTest 2: Synchronous compare');
      const isValidSync = bcrypt.compareSync(passwordToTest, user.password);
      console.log('Result:', isValidSync ? 'SUCCESS ✅' : 'FAILED ❌');
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Test 3: Using newly generated hash with same password
    try {
      console.log('\nTest 3: Validating with newly generated hash');
      const isValidNewHash = await bcrypt.compare(passwordToTest, testHash);
      console.log('Result:', isValidNewHash ? 'SUCCESS ✅' : 'FAILED ❌');
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Test 4: Double string conversion
    try {
      console.log('\nTest 4: Double string conversion');
      const doubleString = String(String(passwordToTest));
      const isValidDoubleString = await bcrypt.compare(doubleString, user.password);
      console.log('Result:', isValidDoubleString ? 'SUCCESS ✅' : 'FAILED ❌');
    } catch (e) {
      console.log('Error:', e.message);
    }

    // Test 5: Character-by-character encoding
    try {
      console.log('\nTest 5: Character-by-character encoding');
      let encodedPassword = '';
      for (let i = 0; i < passwordToTest.length; i++) {
        encodedPassword += passwordToTest.charAt(i);
      }
      const isValidManual = await bcrypt.compare(encodedPassword, user.password);
      console.log('Result:', isValidManual ? 'SUCCESS ✅' : 'FAILED ❌');
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    console.log('\nCONCLUSION:');
    console.log('If all tests failed, the stored hash may have been generated using:');
    console.log('1. A different version of bcrypt');
    console.log('2. A different salt factor');
    console.log('3. A different input password than expected');
    console.log('\nRecommended action: Reset the user password using reset-user-password.js');

  } catch (error) {
    console.error('Error during password validation testing:', error);
  } finally {
    await sequelize.close();
  }
}

testPasswordValidation();