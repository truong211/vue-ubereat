const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const { authMiddleware } = require('../middleware/auth.middleware');
const { authLimiter, loginLimiter, registrationLimiter } = require('../middleware/rate-limit.middleware');
const TokenBlacklist = require('../models/token-blacklist');
const { getDb } = require('../models');

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Initialize database connection
let db = null;
(async () => {
  try {
    db = await getDb();
    console.log('Database initialized for auth routes');
  } catch (error) {
    console.error('Failed to initialize database for auth routes:', error);
  }
})();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs with expiration (in a real app, this should be in a database)
const otpStore = new Map();

// Register a new user with rate limiting
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please try again.'
      });
    }

    const { name, email, phone, password } = req.body;

    // Input validation with specific messages
    if (!name || !email || !phone || !password) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');
      if (!password) missingFields.push('password');
      
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        details: `Please provide: ${missingFields.join(', ')}`
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Phone format validation (basic)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
    }

    // Generate a username from the email (everything before @)
    let username = email.split('@')[0];

    // Check if username exists
    const usernameExists = await db.User.findOne({
      where: { username }
    });

    // If username already exists, add a random number to make it unique
    if (usernameExists) {
      username = `${username}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    try {
      // Attempt to create user - this will trigger password validation and hashing
      const user = await db.User.create({
        username,
        fullName: name,
        email,
        phone,
        password,
        status: 'pending',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false
      });

      // Generate OTP for phone verification
      const otp = generateOTP();

      // Store OTP with expiration
      otpStore.set(phone, {
        otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      });

      console.log(`OTP for ${phone}: ${otp}`); // For development only

      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Registration successful. Verification required.',
        verificationRequired: true,
        userId: user.id
      });
    } catch (passwordError) {
      // Handle password validation errors specifically
      if (passwordError.message.includes('Password must')) {
        return res.status(400).json({
          success: false,
          message: 'Password requirements not met',
          details: passwordError.message
        });
      }
      throw passwordError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login route with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please try again.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        details: `Please provide: ${missingFields.join(', ')}`
      });
    }

    const user = await db.User.findOne({ where: { email } });

    const invalidCredentialsMsg = {
      success: false,
      message: 'Invalid email or password'
    };

    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(401).json(invalidCredentialsMsg);
    }

    try {
      const isPasswordValid = await user.validatePassword(password);
      
      if (!isPasswordValid) {
        console.log(`Login attempt failed: Invalid password for email: ${email}`);
        return res.status(401).json(invalidCredentialsMsg);
      }

      const tokenPayload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { ...tokenPayload, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' }
      );

      // Set secure cookies
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 604800000, // 7 days
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      };

      console.log(`Login successful for user: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        token,
        refreshToken
      });
    } catch (passwordError) {
      console.error('Password validation error:', passwordError);
      return res.status(401).json(invalidCredentialsMsg);
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Add token to blacklist
      await TokenBlacklist.addToBlacklist(token);

      // Clear cookie if it exists
      if (req.cookies && req.cookies.jwt) {
        res.clearCookie('jwt');
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (blacklistError) {
      console.error('Error blacklisting token:', blacklistError);
      return res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// Token refresh route
router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role, email: decoded.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role, email: decoded.email, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    // Blacklist old refresh token
    await TokenBlacklist.addToBlacklist(refreshToken, 604800); // 7 days in seconds

    // Set new cookies
    res.cookie('jwt', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// Get current authenticated user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please try again.'
      });
    }

    // User should be attached to req by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Return user data without sensitive information
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
});

module.exports = router;