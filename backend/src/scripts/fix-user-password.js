/**
 * This script fixes the password for a specific user
 * Run with: node backend/src/scripts/fix-user-password.js
 */
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function fixUserPassword() {
  try {
    console.log('Starting password fix script for user abc8@abc.com');
    
    // Find the user
    const user = await User.findOne({ where: { email: 'abc8@abc.com' } });
    
    if (!user) {
      console.error('User not found!');
      return;
    }
    
    console.log(`Found user: ID ${user.id}, Email: ${user.email}`);
    console.log(`Current password hash length: ${user.password ? user.password.length : 0}`);
    
    // Create a new password hash for a known password (e.g., "123456aA@")
    // This matches the password format in the validation rules (uppercase, lowercase, number, special char)
    const fixedPassword = '123456aA@';
    console.log(`Setting new password hash for "${fixedPassword}"`);
    
    // Generate new hash using bcrypt
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(fixedPassword, salt);
    console.log(`New hash generated: ${newPasswordHash} (length: ${newPasswordHash.length})`);
    
    // Test the new hash
    const isValid = await bcrypt.compare(fixedPassword, newPasswordHash);
    console.log(`New hash validation test: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    if (isValid) {
      // Update user password directly in the database
      console.log('Updating user password...');
      
      // Update using Sequelize model
      user.password = newPasswordHash;
      await user.save();
      
      console.log('Password updated successfully!');
      console.log(`New password for user ${user.email} is: ${fixedPassword}`);
      console.log('Please try logging in with this password now.');
    } else {
      console.error('New hash validation failed. Password not updated.');
    }
  } catch (error) {
    console.error('Error in fix password script:', error);
  } finally {
    // Close database connection
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the script
fixUserPassword(); 