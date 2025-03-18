const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const passport = require('../config/passport');

const router = express.Router();

// Social login routes
/**
 * @route GET /api/auth/google
 * @desc Authenticate with Google
 * @access Public
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route GET /api/auth/google/callback
 * @desc Google auth callback
 * @access Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

/**
 * @route GET /api/auth/facebook
 * @desc Authenticate with Facebook
 * @access Public
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @route GET /api/auth/facebook/callback
 * @desc Facebook auth callback
 * @access Public
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  authController.facebookCallback
);

// Regular auth routes
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('fullName')
      .notEmpty()
      .withMessage('Full name is required')
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  [
    body('username')
      .notEmpty()
      .withMessage('Username or email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  authController.login
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  authController.refreshToken
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
  ],
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password
 * @access Public
 */
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  authController.resetPassword
);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify user email
 * @access Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @route PATCH /api/auth/update-password
 * @desc Update password
 * @access Private
 */
router.patch(
  '/update-password',
  authMiddleware,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],
  authController.updatePassword
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;