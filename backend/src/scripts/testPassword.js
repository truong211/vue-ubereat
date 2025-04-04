require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const db = require('../config/database');

async function testPasswordVerification() {
  try {
    await db.authenticate();
    console.log('Database connection established successfully');

    // Look for test user
    const user = await User.findOne({ 
      where: { email: 'test@example.com' } 
    });

    if (!user) {
      console.log('Test user not found');
      process.exit(1);
    }

    console.log('Test user found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password
    });

    // Test using bcrypt directly
    const plainPassword = '123456';
    console.log('User password hash:', user.password);
    
    const isValid = await bcrypt.compare(plainPassword, user.password);
    console.log('Password valid using bcrypt.compare:', isValid);
    
    // Test using model method
    const isValidModel = await user.correctPassword(plainPassword);
    console.log('Password valid using user.correctPassword:', isValidModel);

    // If password is invalid, update it
    if (!isValid) {
      console.log('Updating password hash...');
      const newHash = await bcrypt.hash(plainPassword, 10);
      user.password = newHash;
      await user.save();
      console.log('Password updated successfully');
      
      // Verify again
      const verifyAfterUpdate = await bcrypt.compare(plainPassword, user.password);
      console.log('Password valid after update:', verifyAfterUpdate);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing password verification:', error);
    process.exit(1);
  }
}

testPasswordVerification(); 