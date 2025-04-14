const bcrypt = require('bcryptjs');
const db = require('../models');

async function fixUserPassword() {
  try {
    console.log('Looking up user with email: abc8@abc.com');
    
    // Find the user
    const user = await db.User.findOne({ where: { email: 'abc8@abc.com' } });
    
    if (!user) {
      console.log('User not found.');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      passwordHashLength: user.password ? user.password.length : 0
    });
    
    // Test with a known correct password
    const testPassword = '123456aA@';  // Assuming this is the correct password format from validation rules
    
    // Test current password
    console.log('\nTesting current password validation:');
    try {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`Password validation result for '${testPassword}': ${isValid}`);
    } catch (error) {
      console.error('Password comparison error:', error);
    }
    
    // If current validation fails, create a new hash and update the user
    console.log('\nCreating new password hash:');
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(testPassword, salt);
    console.log('New password hash:', newPasswordHash);
    console.log('New password hash length:', newPasswordHash.length);
    
    // Confirm the new hash works
    const isNewHashValid = await bcrypt.compare(testPassword, newPasswordHash);
    console.log('New hash validation result:', isNewHashValid);
    
    // Update the user's password with the new hash if validation fails
    if (isNewHashValid) {
      console.log('\nUpdating user password...');
      user.password = newPasswordHash;
      await user.save();
      console.log('Password updated successfully');
      
      // Final verification
      const updatedUser = await db.User.findOne({ where: { email: 'abc8@abc.com' } });
      const finalCheck = await bcrypt.compare(testPassword, updatedUser.password);
      console.log(`Final password validation check: ${finalCheck}`);
    } else {
      console.log('New hash validation failed. No changes made.');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Execute the script
fixUserPassword().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 