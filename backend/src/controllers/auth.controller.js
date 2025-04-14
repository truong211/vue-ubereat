const { User } = require('../../models'); // Import initialized model from index.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const passport = require('../config/passport');
const { googleClient } = require('../config/oauth');
const { AppError } = require('../middleware/error.middleware');
const { hashPassword, verifyPassword } = require('../utils/password.util');

// Get JWT secrets from environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret-key-for-development-only';
const JWT_EMAIL_SECRET = process.env.JWT_EMAIL_SECRET || 'fallback-jwt-email-secret-key-for-development-only';

// JWT version - update this whenever you change the JWT secrets
// This helps clients know when they need to get new tokens
const JWT_VERSION = process.env.JWT_VERSION || '2023-04-21';

// Twilio client setup for SMS OTP
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check existing user
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate username from email
    let username = email.split('@')[0];
    if (username.length < 3) {
      username += Math.random().toString(36).substring(2, 5);
    }

    // Hash password with bcrypt using our utility function
    console.log('--- DEBUG: Password Hashing on Registration ---');
    console.log('Original Password:', password);
    console.log('Original Password Length:', password.length);
    
    // Use the consistent hashPassword utility function
    const hashedPassword = await hashPassword(password);
    
    console.log('Generated Hash Length:', hashedPassword.length);
    console.log('Generated Hash:', hashedPassword);

    // Create user with the hashed password
    const user = await User.create({
      fullName: name,
      email,
      phone,
      username,
      password: hashedPassword,
      isEmailVerified: true, // For development
      role: 'customer'
    });

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Ensure password is a string and not undefined/null
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Debug user data
    console.log('User found:', { 
      id: user.id, 
      email: user.email, 
      passwordLength: user.password ? user.password.length : 0 
    });
    
    // Use our verification utility function consistently
    console.log('--- DEBUG: Pre-Comparison Values ---');
    console.log('Login Password:', password);
    console.log('Plaintext Password Length:', String(password).length);
    console.log('Stored Password Hash:', user.password);
    console.log('Stored Password Hash Length:', user.password.length);

    // Use the password utility for consistent verification
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Login attempt failed: Invalid password for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Update last login
    await User.updateLoginTimestamp(user.id);

    console.log('Login successful for user:', email);
    
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Other functions remain unchanged
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, picture } = ticket.getPayload();
    
    // Find or create user with the correct model
    let user = await User.findByEmail(email);
    
    if (!user) {
      // Generate a valid username from email
      let username = email.split('@')[0];
      
      // Ensure username meets minimum length of 3 characters
      if (username.length < 3) {
        // Add random characters to make it at least 3 characters long
        const randomChars = Math.random().toString(36).substring(2, 5);
        username = username + randomChars;
      }
      
      // Create new user for Google login
      user = await User.create({
        fullName: name,
        email,
        username,
        profileImage: picture,
        isEmailVerified: true,
        socialProvider: 'google',
        socialId: email,
        role: 'customer'
      });
    } else {
      // Update existing user's Google info
      await User.update(
        {
          socialProvider: 'google',
          socialId: email,
          isEmailVerified: true,
          lastLogin: new Date()
        },
        { where: { id: user.id } }
      );
    }
    
    // Generate access token with both id and userId fields
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Generate refresh token with both id and userId fields
    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Update last login time
    await User.updateLoginTimestamp(user.id);
    
    // Get the user's name, ensuring we have a valid value
    const userName = user.fullName || name || email.split('@')[0];
    
    // Send response with both tokens
    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: userName,
        fullName: userName,
        email: user.email,
        role: user.role,
        avatar: user.profileImage
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remaining functions are unchanged