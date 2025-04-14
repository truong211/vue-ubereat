const bcrypt = require('bcryptjs');
const db = require('../../models');
const { query } = require('../config/database');

async function resetUserPassword() {
  try {
    const targetEmail = 'abc8@abc.com'; // Target your specific user
    const newPassword = 'NewPassword123!'; // Set a new strong password
    
    console.log(`Looking up user with email: ${targetEmail}`);
    
    // Find the user using raw query for maximum reliability
    const users = await query('SELECT * FROM users WHERE email = ?', [targetEmail]);
    
    if (!users || users.length === 0) {
      console.log('User not found. Please check the email address.');
      return;
    }
    
    const user = users[0];
    console.log('User found:', {
      id: user.id,
      email: user.email
    });
    
    // Reset password with 12 salt rounds (industry standard for security)
    const newHash = await bcrypt.hash(newPassword, 12);
    
    console.log('Generated new hash:', newHash);
    console.log('Hash length:', newHash.length);
    
    // Update the password directly in the database to bypass hooks
    await query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
    
    console.log('Password updated directly in the database.');
    
    // Verify by fetching the user again
    const updatedUsers = await query('SELECT * FROM users WHERE id = ?', [user.id]);
    const updatedUser = updatedUsers[0];
    console.log('Updated password hash:', updatedUser.password);
    
    // Test verification
    const verifyResult = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`Password verification result: ${verifyResult}`);
    
    if (verifyResult) {
      console.log('Password reset successful!');
      console.log('You can now login with:');
      console.log(`Email: ${targetEmail}`);
      console.log(`Password: ${newPassword}`);
    } else {
      console.log('WARNING: Password verification failed. There might be an issue with bcrypt configuration.');
    }
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    // Close database connection if available
    if (db && db.sequelize) {
      try {
        await db.sequelize.close();
      } catch (err) {
        console.log('Note: Error closing sequelize connection:', err.message);
      }
    }
    
    // Force process to exit
    setTimeout(() => process.exit(0), 1000);
  }
}

resetUserPassword();