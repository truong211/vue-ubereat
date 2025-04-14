const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authJwt } = require('../middleware');

// User registration
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').optional(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  authController.register
);

// User login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Get current user
router.get('/me', [authJwt.verifyToken], authController.getCurrentUser);

// Verify phone OTP
router.post('/verify-phone', authController.verifyPhoneOTP);

// Resend phone OTP
router.post('/resend-phone-otp', authController.resendPhoneOTP);

// Logout
router.post('/logout', authController.logout);

// Refresh token
router.post('/refresh', authController.refreshToken);

module.exports = router;