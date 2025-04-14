/**
 * This script fixes the password hash for a specific user (abc8@abc.com)
 * 
 * Usage: 
 * 1. Make sure database connection is configured correctly
 * 2. Run: node backend/src/scripts/fix-specific-user.js
 */

const bcrypt = require('bcryptjs');
const db = require('../models');

async function fixSpecificUser() {
  try {
    console.log('Starting to fix user abc8@abc.com password...');
    
    // Find the user by email
    const user = await db.User.findOne({ where: { email: 'abc8@abc.com' } });
    
    if (!user) {
      console.error('User not found!');
      return;
    }
    
    console.log(`Found user: ID ${user.id}, Email: ${user.email}`);
    console.log(`Current password hash length: ${user.password ? user.password.length : 0}`);
    
    // Create a new password hash with bcrypt
    const fixedPassword = '123456aA@';
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(fixedPassword, salt);
    
    console.log(`New hash generated (length: ${newPasswordHash.length})`);
    
    // Test the new hash works with the password
    const testResult = await bcrypt.compare(fixedPassword, newPasswordHash);
    console.log(`Hash verification test: ${testResult ? 'PASSED' : 'FAILED'}`);
    
    if (testResult) {
      // Update the user's password
      console.log('Updating user password...');
      
      // Method 1: Using the User model instance
      user.password = newPasswordHash;
      await user.save();
      
      // Verify the update
      const updatedUser = await db.User.findOne({ where: { email: 'abc8@abc.com' } });
      console.log(`Updated password hash length: ${updatedUser.password.length}`);
      
      // Test the updated password hash
      const finalVerification = await bcrypt.compare(fixedPassword, updatedUser.password);
      console.log(`Final verification: ${finalVerification ? 'SUCCESS' : 'FAILED'}`);
      
      if (finalVerification) {
        console.log('Password successfully fixed!');
        console.log(`User ${user.email} can now login with password: ${fixedPassword}`);
      } else {
        console.error('Failed to update password correctly.');
      }
    } else {
      console.error('Hash verification failed. Password not updated.');
    }
    
    console.log('Script completed.');
  } catch (error) {
    console.error('Error fixing user password:', error);
  } finally {
    // Close database connection
    if (db.sequelize) {
      await db.sequelize.close();
    }
    process.exit(0);
  }
}

// Run the script
fixSpecificUser(); 