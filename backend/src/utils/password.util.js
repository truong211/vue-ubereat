/**
 * Password utility functions for consistent password handling across the application
 */
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

/**
 * Hashes a plaintext password consistently
 * @param {string} plainPassword - The plaintext password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (plainPassword) => {
  try {
    if (!plainPassword) {
      throw new Error('No password provided for hashing');
    }

    // Convert to string and validate password requirements
    const passwordToHash = String(plainPassword);
    
    // Password requirements
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(passwordToHash);
    const hasLowercase = /[a-z]/.test(passwordToHash);
    const hasNumber = /[0-9]/.test(passwordToHash);
    const hasSpecial = /[!@#$%^&*]/.test(passwordToHash);

    if (passwordToHash.length < minLength) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!hasUppercase) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
      throw new Error('Password must contain at least one number');
    }
    if (!hasSpecial) {
      throw new Error('Password must contain at least one special character (!@#$%^&*)');
    }

    console.log('--- DEBUG: Password Hashing ---');
    console.log('Password Length:', passwordToHash.length);
    console.log('Password Requirements Met:', { hasUppercase, hasLowercase, hasNumber, hasSpecial });

    // Generate salt and hash consistently
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    console.log('Generated Hash Length:', hashedPassword.length);
    console.log('Generated Hash Format:', hashedPassword.substring(0, 7));
    
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Verifies a plaintext password against a stored hash using multiple methods for maximum compatibility
 * @param {string} plainPassword - The plaintext password to verify
 * @param {string} hashedPassword - The stored password hash to compare against
 * @returns {Promise<boolean>} - Whether the password matches
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    console.log('--- DEBUG: Password Verification ---');

    // Input validation
    if (!plainPassword || !hashedPassword) {
      console.log('Password verification failed: Missing input', {
        hasPlainPassword: !!plainPassword,
        hasHashedPassword: !!hashedPassword
      });
      return false;
    }

    // Convert to string but DO NOT trim - preserve exact password
    const passwordToVerify = String(plainPassword);

    // Verify bcrypt hash format
    if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
      console.error('Invalid bcrypt hash format:', hashedPassword.substring(0, 7));
      return false;
    }

    console.log('Verification Details:');
    console.log('Password Length:', passwordToVerify.length);
    console.log('Hash Length:', hashedPassword.length);
    console.log('Hash Format:', hashedPassword.substring(0, 7));

    // Use the standard bcrypt compare method
    const isValid = await bcrypt.compare(passwordToVerify, hashedPassword);
    console.log('Password verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  SALT_ROUNDS
};