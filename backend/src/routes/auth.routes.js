const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const passport = require('../config/passport');

const router = express.Router();

// Social login routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  authController.facebookCallback
);

// Direct social login - routes expected by frontend
router.post(
  '/login/google',
  [body('idToken').notEmpty().withMessage('Google ID token is required')],
  authController.googleLogin
);
router.post(
  '/login/facebook',
  [body('accessToken').notEmpty().withMessage('Facebook access token is required')],
  authController.facebookLogin
);

// Legacy routes for backward compatibility
router.post(
  '/google-login',
  [body('idToken').notEmpty().withMessage('Google ID token is required')],
  authController.googleLogin
);
router.post(
  '/facebook-login',
  [body('accessToken').notEmpty().withMessage('Facebook access token is required')],
  authController.facebookLogin
);

// Kiểm tra email đã tồn tại chưa
router.post(
  '/check-email',
  [
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email')
  ],
  authController.checkEmail
);

// Kiểm tra số điện thoại đã tồn tại chưa
router.post(
  '/check-phone',
  [
    body('phone').notEmpty().withMessage('Phone number is required')
  ],
  authController.checkPhone
);

// Regular auth routes
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

router.post(
  '/verify-email-otp',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  authController.verifyEmailOTP
);

router.post(
  '/resend-email-otp',
  [
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email')
  ],
  authController.resendEmailOTP
);

router.post(
  '/request-phone-otp',
  protect,
  [
    body('phone').notEmpty().withMessage('Phone number is required')
  ],
  authController.requestPhoneOTP
);

router.post(
  '/verify-phone-otp',
  protect,
  [
    body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  authController.verifyPhoneOTP
);

router.post(
  '/request-password-reset',
  [
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email')
  ],
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').notEmpty().withMessage('New password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  authController.resetPassword
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

// Add a new endpoint to explicitly refresh a token (with simpler URL)
router.post('/refresh', authController.refreshToken);

// Social account management routes
router.post('/link/:provider', protect, authController.linkSocialAccount);
router.post('/unlink/:provider', protect, authController.unlinkSocialAccount);
router.get('/linked-accounts', protect, authController.getLinkedAccounts);

router.patch('/profile', protect, authController.updateProfile);

router.patch(
  '/update-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  authController.updatePassword
);

router.post(
  '/favorites/dishes',
  protect,
  [
    body('dishId').notEmpty().withMessage('Dish ID is required')
  ],
  authController.addFavoriteDish
);

router.delete('/favorites/dishes/:id', protect, authController.removeFavoriteDish);
router.get('/favorites/dishes', protect, authController.getFavoriteDishes);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

// Export the router directly since app.js uses it with app.use()
module.exports = router;