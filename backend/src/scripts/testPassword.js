require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

async function testPasswordValidation() {
  try {
    console.log('Looking up user with email: test12@gmail.com');
    
    // Find the user
    const user = await db.User.findOne({ where: { email: 'test12@gmail.com' } });
    
    if (!user) {
      console.log('User not found.');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      passwordHash: user.password,
      passwordHashLength: user.password ? user.password.length : 0
    });
    
    // Test passwords
    const testPasswords = [
      'password123',
      'test12345',
      'test123'
    ];
    
    console.log('\nTesting password validation methods:');
    for (const testPassword of testPasswords) {
      console.log(`\nTesting password: "${testPassword}"`);
      
      // Method 1: Direct bcrypt compare
      const directResult = await bcrypt.compare(testPassword, user.password);
      console.log('Direct bcrypt.compare result:', directResult);
      
      // Method 2: Using the model's validatePassword method
      const modelResult = await user.validatePassword(testPassword);
      console.log('Model validatePassword result:', modelResult);
    }
    
    // Create a simple test to create a known password hash
    const plainPassword = 'test123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('\nTest hash generation:');
    console.log(`Plain password: ${plainPassword}`);
    console.log(`Generated hash: ${hashedPassword}`);
    
    // Verify the generated hash
    const verifyResult = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`Verification of test hash: ${verifyResult}`);
    
    // Test password update (uncomment if you want to update the password)
    /*
    console.log('\nUpdating user password to: test123');
    user.password = hashedPassword;
    await user.save();
    console.log('Password updated successfully');
    */
    
  } catch (error) {
    console.error('Error testing password validation:', error);
  } finally {
    // Close database connection
    if (db.sequelize) {
      await db.sequelize.close();
    }
  }
}

testPasswordValidation(); 