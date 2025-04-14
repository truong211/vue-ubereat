const bcrypt = require('bcryptjs');
const db = require('../../models');
const { query } = require('../config/database');

async function resetUserPassword() {
  try {
    console.log('Looking up user with email: abc@abc.com');
    
    // Find the user using raw query for maximum reliability
    const users = await query('SELECT * FROM users WHERE email = ?', ['abc@abc.com']);
    
    if (!users || users.length === 0) {
      console.log('User not found. Creating new user...');
      
      // Create a new user if one doesn't exist
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12); // Using 12 rounds for security
      
      const result = await query(`
        INSERT INTO users (email, username, password, fullName, role, isEmailVerified, isPhoneVerified, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['abc@abc.com', 'abc_user', hashedPassword, 'Test User', 'customer', 1, 1, 1]);
      
      console.log('New user created with ID:', result.insertId);
      console.log('You can now login with:');
      console.log('Email: abc@abc.com');
      console.log('Password: password123');
      return;
    }
    
    const user = users[0];
    console.log('User found:', {
      id: user.id,
      email: user.email
    });
    
    // Reset password to 'password123' with 12 salt rounds to match model configuration
    const plainPassword = 'password123';
    const newHash = await bcrypt.hash(plainPassword, 12);
    
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
    const verifyResult = await bcrypt.compare(plainPassword, updatedUser.password);
    console.log(`Password verification result: ${verifyResult}`);
    
    if (verifyResult) {
      console.log('Password reset successful!');
      console.log('You can now login with:');
      console.log('Email: abc@abc.com');
      console.log('Password: password123');
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