const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const oauthConfig = require('../config/oauth.config');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, oauthConfig.jwt.secret, {
    expiresIn: oauthConfig.jwt.expiresIn
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, oauthConfig.jwt.secret, {
    expiresIn: '30d'
  });
};

/**
 * Generate random token for verification or password reset
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, fullName, phone, address, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return next(new AppError('User already exists with this username or email', 400));
    }

    // Generate verification token
    const verificationToken = generateRandomToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model hook
      fullName,
      phone,
      address,
      role: role || 'customer',
      isEmailVerified: false,
      verificationToken,
      verificationExpires
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken, fullName);

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        user: user.toJSON(),
        message: 'Registration successful. Please verify your email address.'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with this verification token and token hasn't expired
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    if (user.isEmailVerified) {
      return next(new AppError('Email already verified', 400));
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username } // Allow login with email as well
        ]
      }
    });

    if (!user || !(await user.correctPassword(password))) {
      return next(new AppError('Incorrect username or password', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth login callback
 * @route GET /api/auth/google/callback
 * @access Public
 */
exports.googleCallback = async (req, res, next) => {
  try {
    // The user data will be available in req.user by Passport
    const { id, emails, displayName, photos } = req.user;
    
    // Check if user exists
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { socialId: id, socialProvider: 'google' },
          { email: emails[0].value }
        ]
      }
    });

    if (!user) {
      // Create new user
      const username = `google_${id}`;
      
      user = await User.create({
        username,
        email: emails[0].value,
        fullName: displayName,
        profileImage: photos[0]?.value || null,
        socialProvider: 'google',
        socialId: id,
        isEmailVerified: true,  // Email already verified through Google
        password: null          // No password for social login
      });
    } else if (user.socialProvider !== 'google') {
      // If user exists but used different login method before
      user.socialProvider = 'google';
      user.socialId = id;
      user.isEmailVerified = true;
      await user.save();
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/social?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Facebook OAuth login callback
 * @route GET /api/auth/facebook/callback
 * @access Public
 */
exports.facebookCallback = async (req, res, next) => {
  try {
    // The user data will be available in req.user by Passport
    const { id, emails, displayName, photos } = req.user;
    
    // Check if user exists
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { socialId: id, socialProvider: 'facebook' },
          emails && emails[0]?.value ? { email: emails[0].value } : {}
        ]
      }
    });

    if (!user) {
      // Create new user
      const username = `fb_${id}`;
      const email = emails && emails[0]?.value ? emails[0].value : `${id}@facebook.com`;
      
      user = await User.create({
        username,
        email,
        fullName: displayName,
        profileImage: photos && photos[0]?.value ? photos[0].value : null,
        socialProvider: 'facebook',
        socialId: id,
        isEmailVerified: true,  // Email already verified through Facebook
        password: null          // No password for social login
      });
    } else if (user.socialProvider !== 'facebook') {
      // If user exists but used different login method before
      user.socialProvider = 'facebook';
      user.socialId = id;
      user.isEmailVerified = true;
      await user.save();
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/social?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, oauthConfig.jwt.secret);

    // Check if user exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // Generate new access token
    const token = generateToken(user.id);

    res.status(200).json({
      status: 'success',
      token
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid refresh token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token has expired. Please log in again', 401));
    }
    next(error);
  }
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('There is no user with this email address', 404));
    }

    // Generate password reset token
    const resetToken = generateRandomToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token and expiry to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.fullName);
      
      res.status(200).json({
        status: 'success',
        message: 'Password reset instructions sent to email'
      });
    } catch (error) {
      // Reset the token fields if email sending fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      return next(new AppError('Error sending email. Please try again.', 500));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with this reset token and token hasn't expired
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return next(new AppError('Password reset token is invalid or has expired', 400));
    }

    // Update password
    user.password = password; // Will be hashed by the model hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Generate new tokens
    const newToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      status: 'success',
      token: newToken,
      refreshToken,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update password
 * @route PATCH /api/auth/update-password
 * @access Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const user = await User.findByPk(req.user.id);

    // Check if user has a password (might be social login)
    if (!user.password) {
      return next(new AppError('You need to set a password first', 400));
    }

    // Check if current password is correct
    if (!(await user.correctPassword(currentPassword))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword; // Will be hashed by the model hook
    await user.save();

    // Generate new token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      refreshToken,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = (req, res) => {
  // In a stateless JWT authentication, there's no server-side logout
  // The client should remove the token from storage
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};