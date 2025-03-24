const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
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

/**
 * @route POST /api/auth/google-login
 * @desc Login with Google ID token
 * @access Public
 */
router.post('/google-login', authController.googleLogin);

/**
 * @route POST /api/auth/facebook-login
 * @desc Login with Facebook access token
 * @access Public
 */
router.post('/facebook-login', authController.facebookLogin);

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
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
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
 * @route POST /api/auth/verify-email-otp
 * @desc Verify email with OTP
 * @access Public
 */
router.post(
  '/verify-email-otp',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  authController.verifyEmailOTP
);

/**
 * @route POST /api/auth/resend-email-otp
 * @desc Resend email verification OTP
 * @access Public
 */
router.post(
  '/resend-email-otp',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
  ],
  authController.resendEmailOTP
);

/**
 * @route POST /api/auth/request-phone-otp
 * @desc Request phone verification OTP
 * @access Private
 */
router.post(
  '/request-phone-otp',
  authenticate,
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
  ],
  authController.requestPhoneOTP
);

/**
 * @route POST /api/auth/verify-phone-otp
 * @desc Verify phone with OTP
 * @access Private
 */
router.post(
  '/verify-phone-otp',
  authenticate,
  [
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  authController.verifyPhoneOTP
);

/**
 * @route POST /api/auth/request-password-reset
 * @desc Request password reset OTP
 * @access Public
 */
router.post(
  '/request-password-reset',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
  ],
  authController.requestPasswordReset
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with OTP
 * @access Public
 */
router.post(
  '/reset-password',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  authController.resetPassword
);

/**
 * @route POST /api/auth/login/google
 * @desc Login with Google
 * @access Public
 */
router.post(
  '/login/google',
  [
    body('idToken')
      .notEmpty()
      .withMessage('Google ID token is required')
  ],
  authController.googleLogin
);

/**
 * @route POST /api/auth/login/facebook
 * @desc Login with Facebook
 * @access Public
 */
router.post(
  '/login/facebook',
  [
    body('accessToken')
      .notEmpty()
      .withMessage('Facebook access token is required')
  ],
  authController.facebookLogin
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh token
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
 * @route PATCH /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.patch(
  '/profile',
  authenticate,
  authController.updateProfile
);

/**
 * @route PATCH /api/auth/update-password
 * @desc Update user password
 * @access Private
 */
router.patch(
  '/update-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],
  authController.updatePassword
);

/**
 * @route POST /api/auth/favorites/dishes
 * @desc Add favorite dish
 * @access Private
 */
router.post(
  '/favorites/dishes',
  authenticate,
  [
    body('dishId')
      .notEmpty()
      .withMessage('Dish ID is required')
  ],
  authController.addFavoriteDish
);

/**
 * @route DELETE /api/auth/favorites/dishes/:id
 * @desc Remove favorite dish
 * @access Private
 */
router.delete(
  '/favorites/dishes/:id',
  authenticate,
  authController.removeFavoriteDish
);

/**
 * @route GET /api/auth/favorites/dishes
 * @desc Get favorite dishes
 * @access Private
 */
router.get(
  '/favorites/dishes',
  authenticate,
  authController.getFavoriteDishes
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
router.get('/me', authenticate, authController.getMe);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;