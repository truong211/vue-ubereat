const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Registration and authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/facebook-login', authController.facebookLogin);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/logout', authMiddleware.verifyToken, authController.logout);

// Password recovery and verification routes
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email-otp', authController.verifyEmailOTP);
router.post('/resend-email-otp', authController.resendEmailOTP);

// User profile routes
router.get('/me', authMiddleware.verifyToken, authController.getMe);
router.patch('/profile', authMiddleware.verifyToken, authController.updateProfile);
router.patch('/update-password', authMiddleware.verifyToken, authController.updatePassword);

// Favorite dish routes
router.post('/favorites/dishes', authMiddleware.verifyToken, authController.addFavoriteDish);
router.delete('/favorites/dishes/:id', authMiddleware.verifyToken, authController.removeFavoriteDish);
router.get('/favorites/dishes', authMiddleware.verifyToken, authController.getFavoriteDishes);

// Token refreshing
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
