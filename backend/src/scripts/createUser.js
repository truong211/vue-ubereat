require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const db = require('../config/database');

async function createTestUser() {
  try {
    await db.authenticate();
    console.log('Database connection established successfully');

    // Create test user
    const plainPassword = '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('Generated password hash:', hashedPassword);
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email: 'test@example.com' } 
    });

    let user;
    if (existingUser) {
      console.log('Test user already exists, updating password...');
      existingUser.password = hashedPassword;
      existingUser.isEmailVerified = true;
      user = await existingUser.save();
      console.log('User updated successfully');
    } else {
      console.log('Creating new test user...');
      user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        isEmailVerified: true,
        role: 'customer'
      });
      console.log('Test user created successfully');
    }
    
    // Verify the password works
    const passwordValid = await bcrypt.compare(plainPassword, user.password);
    console.log('Password validation check:', passwordValid);

    console.log('User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordHash: user.password
    });
    
    console.log('You can now login with: test@example.com / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser(); 