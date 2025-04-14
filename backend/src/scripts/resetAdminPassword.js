require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

async function resetAdminPassword() {
  try {
    console.log('Looking up user with email: abc4@abc.com');
    
    // Find the user
    const user = await db.User.findOne({ where: { email: 'abc4@abc.com' } });
    
    if (!user) {
      console.log('User not found.');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Reset password to 'password123'
    const plainPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('Generated new hash:', hashedPassword);
    console.log('Hash length:', hashedPassword.length);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('Password updated successfully.');
    console.log('New login credentials:');
    console.log('Email: abc4@abc.com');
    console.log('Password: password123');
    
    // Verify the new password
    const isValid = await user.validatePassword(plainPassword);
    console.log('Password validation check:', isValid);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
