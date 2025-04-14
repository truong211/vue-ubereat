/**
 * Password Reset Utility for User Model
 * Usage: node backend/scripts/resetUserPassword.js <email> <newPassword>
 *
 * - Accepts an email and a new plaintext password as arguments.
 * - Uses the User model's update method so that the beforeUpdate hook (with 12 salt rounds) is triggered and the password is properly hashed.
 * - Only updates the password for the specified user.
 * - Does not modify any other logic or files.
 */

const path = require('path');
const { User, sequelize } = require('../models');

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Usage: node backend/scripts/resetUserPassword.js <email> <newPassword>');
    process.exit(1);
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(2);
    }

    // Update password using instance method to trigger beforeUpdate hook
    user.password = newPassword;
    await user.save(); // Triggers beforeUpdate

    console.log(`Password reset successful for user: ${email}`);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(3);
  } finally {
    await sequelize.close();
  }
}

// Parse command-line arguments
const [,, email, newPassword] = process.argv;
resetPassword(email, newPassword);