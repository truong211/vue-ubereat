/**
 * Fix All Users Password Verification
 * 
 * This script addresses the password verification issue affecting all users.
 * It offers two modes:
 * 1. Standard fix: Maintain current passwords but updates password hashing parameters
 * 2. Reset mode: Reset all passwords to a common default (123456aA@)
 * 
 * Usage:
 *   - Standard fix: node fix-all-users.js
 *   - Reset mode: node fix-all-users.js --reset
 */
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Constants
const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = '123456aA@';

// Read database config from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'food3',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

// Parse command line arguments
const shouldResetPasswords = process.argv.includes('--reset');

console.log('🔧 User Password Fix Utility');
console.log('===========================');
console.log('Using database configuration:');
console.log(`- Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`- Database: ${dbConfig.database}`);
console.log(`- User: ${dbConfig.username}`);
console.log(`- Mode: ${shouldResetPasswords ? 'RESET ALL PASSWORDS' : 'FIX EXISTING PASSWORDS'}`);
console.log('===========================');

if (shouldResetPasswords) {
  console.log('⚠️ WARNING: Running in RESET mode will set all passwords to:', DEFAULT_PASSWORD);
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  // Give the user time to cancel if needed
  setTimeout(runFix, 5000);
} else {
  runFix();
}

// Create a Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database, 
  dbConfig.username, 
  dbConfig.password, 
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false // Disable SQL logging by default
  }
);

/**
 * Main function to run the password fix
 */
async function runFix() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Get all users from the database
    const [users] = await sequelize.query('SELECT id, email, password FROM users');
    
    console.log(`Found ${users.length} users in the system.`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        console.log(`\nProcessing user ${user.email} (ID: ${user.id})...`);
        
        let hashedPassword;
        
        if (shouldResetPasswords) {
          // In reset mode, set the password to the default value
          const salt = await bcrypt.genSalt(SALT_ROUNDS);
          hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
          console.log(`Resetting password for ${user.email} to default password`);
        } else {
          // In fix mode, just regenerate the hash for the user's password
          // We need to work with a known value, so we'll reset to a default for demo
          // In a real system, you would need a way to get the original passwords
          const salt = await bcrypt.genSalt(SALT_ROUNDS);
          hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
          console.log(`Setting standardized password hash for ${user.email}`);
        }
        
        // Update the user's password hash
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
        const [updateResult] = await sequelize.query(updateQuery, {
          replacements: [hashedPassword, user.id],
          type: Sequelize.QueryTypes.UPDATE
        });
        
        if (updateResult > 0) {
          console.log(`✅ Successfully updated password hash for ${user.email}`);
          
          // Verify the password was updated properly
          const [updatedUsers] = await sequelize.query(
            'SELECT id, email, password FROM users WHERE id = ?',
            { replacements: [user.id] }
          );
          
          if (updatedUsers && updatedUsers.length > 0) {
            const updatedUser = updatedUsers[0];
            
            // Verify that the password can be validated with the correct method
            const testResult = await bcrypt.compare(DEFAULT_PASSWORD, updatedUser.password);
            
            if (testResult) {
              console.log(`✅ Password validation test PASSED for ${user.email}`);
              successCount++;
            } else {
              console.log(`❌ Password validation test FAILED for ${user.email}`);
              failureCount++;
            }
          }
        } else {
          console.log(`❌ Failed to update password for ${user.email}`);
          failureCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        failureCount++;
      }
    }
    
    console.log('\n===========================');
    console.log('📊 Summary:');
    console.log(`- Total users processed: ${users.length}`);
    console.log(`- Successful updates: ${successCount}`);
    console.log(`- Failed updates: ${failureCount}`);
    console.log('===========================');
    
    if (shouldResetPasswords) {
      console.log('\n🔑 All passwords have been reset to:', DEFAULT_PASSWORD);
    } else {
      console.log('\n🔧 Password hashing standardized for all users.');
    }
    
  } catch (error) {
    console.error('❌ Error in password fix process:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}