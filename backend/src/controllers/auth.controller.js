const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const otpService = require('../services/otp.service');
const socialAuthService = require('../services/social-auth.service');
const config = require('../config/config');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
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

    // Generate OTP for email verification
    const otp = await otpService.createOTP(user.id, 'email');
    
    // Send verification email with OTP
    await otpService.sendOTPEmail(email, otp, fullName);

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        user: user.toJSON(),
        message: 'Registration successful. Please verify your email with the OTP sent.'
      }
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
 * Verify email with OTP
 * @route POST /api/auth/verify-email-otp
 * @access Public
 */
exports.verifyEmailOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return next(new AppError('User ID and OTP are required', 400));
    }

    // Verify OTP
    await otpService.verifyOTP(userId, otp, 'email');

    // Get updated user info
    const user = await User.findByPk(userId);

    // Generate tokens if not already authenticated
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      refreshToken,
      data: {
        message: 'Email verified successfully',
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification OTP
 * @route POST /api/auth/resend-email-otp
 * @access Public
 */
exports.resendEmailOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('User not found with this email', 404));
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return next(new AppError('Email is already verified', 400));
    }

    // Generate new OTP
    const otp = await otpService.createOTP(user.id, 'email');
    
    // Send verification email with OTP
    await otpService.sendOTPEmail(email, otp, user.fullName);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Verification OTP sent to your email',
        userId: user.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request phone verification OTP
 * @route POST /api/auth/request-phone-otp
 * @access Private
 */
exports.requestPhoneOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    if (!phone) {
      return next(new AppError('Phone number is required', 400));
    }

    // Update user's phone if provided
    if (phone) {
      await User.update({ phone }, { where: { id: userId } });
    }

    // Generate OTP
    const otp = await otpService.createOTP(userId, 'phone');
    
    // Send OTP via SMS
    await otpService.sendOTPSMS(phone, otp);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Verification OTP sent to your phone'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify phone with OTP
 * @route POST /api/auth/verify-phone-otp
 * @access Private
 */
exports.verifyPhoneOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    if (!otp) {
      return next(new AppError('OTP is required', 400));
    }

    // Verify OTP
    await otpService.verifyOTP(userId, otp, 'phone');

    // Get updated user info
    const user = await User.findByPk(userId);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Phone verified successfully',
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset OTP
 * @route POST /api/auth/request-password-reset
 * @access Public
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('User not found with this email', 404));
    }

    // Generate OTP
    const otp = await otpService.createOTP(user.id, 'password');
    
    // Send OTP via email
    await otpService.sendOTPEmail(email, otp, user.fullName, 'password-reset');

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Password reset OTP sent to your email',
        userId: user.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with OTP
 * @route POST /api/auth/reset-password
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return next(new AppError('User ID, OTP, and new password are required', 400));
    }

    // Verify OTP
    await otpService.verifyOTP(userId, otp, 'password');

    // Update password
    const user = await User.findByPk(userId);
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Password reset successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login with Google
 * @route POST /api/auth/login/google
 * @access Public
 */
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new AppError('Google ID token is required', 400));
    }

    // Verify Google token and get or create user
    const user = await socialAuthService.loginWithGoogle(idToken);

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
 * Login with Facebook
 * @route POST /api/auth/login/facebook
 * @access Public
 */
exports.facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return next(new AppError('Facebook access token is required', 400));
    }

    // Verify Facebook token and get or create user
    const user = await socialAuthService.loginWithFacebook(accessToken);

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
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid refresh token', 401));
      }
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Refresh token has expired. Please log in again', 401));
      }
      throw err;
    }

    // Check if user exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // Generate new access token
    const token = generateToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PATCH /api/auth/profile
 * @access Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, address, notificationPreferences, preferredLanguage } = req.body;

    // Fields that can be updated
    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (address) updateFields.address = address;
    if (notificationPreferences) updateFields.notificationPreferences = notificationPreferences;
    if (preferredLanguage) updateFields.preferredLanguage = preferredLanguage;

    // Update user
    await User.update(updateFields, { where: { id: userId } });

    // Get updated user
    const user = await User.findByPk(userId);

    res.status(200).json({
      status: 'success',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user password
 * @route PATCH /api/auth/update-password
 * @access Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    // Find user
    const user = await User.findByPk(userId);

    // Check current password
    if (!(await user.correctPassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Password updated successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add favorite dish
 * @route POST /api/auth/favorites/dishes
 * @access Private
 */
exports.addFavoriteDish = async (req, res, next) => {
  try {
    const { dishId } = req.body;
    const userId = req.user.id;

    if (!dishId) {
      return next(new AppError('Dish ID is required', 400));
    }

    // Get user
    const user = await User.findByPk(userId);
    
    // Add dish to favorites if not already there
    const favorites = user.favoriteDishes || [];
    if (!favorites.includes(dishId)) {
      favorites.push(dishId);
      user.favoriteDishes = favorites;
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Dish added to favorites',
        favoriteDishes: user.favoriteDishes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove favorite dish
 * @route DELETE /api/auth/favorites/dishes/:id
 * @access Private
 */
exports.removeFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.params.id;
    const userId = req.user.id;

    // Get user
    const user = await User.findByPk(userId);
    
    // Remove dish from favorites
    const favorites = user.favoriteDishes || [];
    user.favoriteDishes = favorites.filter(id => id !== dishId);
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Dish removed from favorites',
        favoriteDishes: user.favoriteDishes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get favorite dishes
 * @route GET /api/auth/favorites/dishes
 * @access Private
 */
exports.getFavoriteDishes = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user with their favorite dishes
    const user = await User.findByPk(userId);

    res.status(200).json({
      status: 'success',
      data: {
        favoriteDishes: user.favoriteDishes || []
      }
    });
  } catch (error) {
    next(error);
  }
};