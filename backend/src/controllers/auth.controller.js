const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
};

/**
 * Generate email verification token
 */
const generateVerificationToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_EMAIL_SECRET, {
    expiresIn: '24h'
  });
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Food Delivery!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `
  });
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

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model hook
      fullName,
      phone,
      address,
      role: role || 'customer',
      isEmailVerified: false
    });

    // Generate verification token
    const verificationToken = generateVerificationToken(user.id);

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        user,
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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);

    // Find and update user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('Invalid verification token', 400));
    }

    if (user.isEmailVerified) {
      return next(new AppError('Email already verified', 400));
    }

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid verification token', 400));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Verification token has expired', 400));
    }
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
        user
      }
    });
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
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

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

    // Generate password reset token (in a real app, you would send this via email)
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email',
      resetToken // In production, don't send this in the response
    });
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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Update password
    user.password = password; // Will be hashed by the model hook
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Token is invalid or has expired', 400));
    }
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