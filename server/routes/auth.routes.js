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

// ...existing code...

module.exports = router;
