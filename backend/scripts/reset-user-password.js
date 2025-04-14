/**
 * Direct User Password Reset Utility
 * This script updates a user's password directly in the database
 * to resolve any password validation issues.
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
    logging: console.log // Enable SQL logging for debugging
  }
);

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node reset-user-password.js <email> <newPassword>');
  process.exit(1);
}

async function resetPassword() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Find the user by email
    const [users] = await sequelize.query(
      'SELECT id, email, password FROM users WHERE email = ?',
      { 
        replacements: [email]
      }
    );

    if (!users || users.length === 0) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    
    // Generate a new hash using bcrypt
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Generated password hash details:');
    console.log('Original password:', newPassword);
    console.log('Password length:', newPassword.length);
    console.log('Generated hash:', hashedPassword);
    console.log('Hash length:', hashedPassword.length);

    // Try a different update approach - using direct SQL with logging
    try {
      console.log('Attempting to update password...');
      
      // Try with a simpler direct query first
      const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
      const [result] = await sequelize.query(updateQuery, {
        replacements: [hashedPassword, user.id],
        type: Sequelize.QueryTypes.UPDATE
      });
      
      console.log('Update query result:', result);
      
      if (result > 0) {
        console.log(`Successfully reset password for user ${email} (${result} rows affected)`);
        
        // Verify the password was updated
        const [updatedUsers] = await sequelize.query(
          'SELECT id, email, password FROM users WHERE id = ?',
          { 
            replacements: [user.id]
          }
        );
        
        if (updatedUsers && updatedUsers.length > 0) {
          const updatedUser = updatedUsers[0];
          console.log('Updated user hash:', updatedUser.password.substring(0, 10) + '...');
          
          // Test if the new password can be validated
          const isValid = await bcrypt.compare(newPassword, updatedUser.password);
          console.log(`Validation test for new password: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
          
          if (isValid) {
            console.log('🎉 Password reset successful! You can now log in with the new password.');
          } else {
            console.log('⚠️ Password was updated but validation test failed.');
          }
        }
      } else {
        console.error('Failed to update password. No rows affected.');
        console.log('Trying alternative approach...');
        
        // Try with a more explicit UPDATE statement
        const alternativeQuery = `
          UPDATE users 
          SET 
            password = ?,
            updatedAt = NOW()
          WHERE id = ?
        `;
        
        const [alternativeResult] = await sequelize.query(alternativeQuery, {
          replacements: [hashedPassword, user.id],
          type: Sequelize.QueryTypes.UPDATE
        });
        
        console.log('Alternative update result:', alternativeResult);
        
        if (alternativeResult > 0) {
          console.log(`Successfully reset password using alternative method (${alternativeResult} rows affected)`);
        } else {
          console.error('Both password update attempts failed.');
          console.log('Database might be locked or user might not be updatable.');
        }
      }
    } catch (updateError) {
      console.error('Error during password update:', updateError);
    }

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

resetPassword();