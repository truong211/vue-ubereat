const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const passport = require('../config/passport');
const { googleClient } = require('../config/oauth');
const { AppError } = require('../middleware/error.middleware');

// Get JWT secrets from environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret-key-for-development-only';
const JWT_EMAIL_SECRET = process.env.JWT_EMAIL_SECRET || 'fallback-jwt-email-secret-key-for-development-only';

// JWT version - update this whenever you change the JWT secrets
// This helps clients know when they need to get new tokens
const JWT_VERSION = process.env.JWT_VERSION || '2023-04-21';

// Twilio client setup for SMS OTP
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if email already exists with correct model
    const existingEmail = await User.findByEmail(email);
    
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Email already registered. Please use a different email.'
      });
    }
    
    // Check if phone already exists (if provided) with correct model
    if (phone) {
      try {
        // Use a direct SQL query similar to findByEmail
        const sql = 'SELECT * FROM users WHERE phone = ?';
        const results = await db.query(sql, [phone]);
        
        if (results.length > 0) {
          return res.status(400).json({
            message: 'Phone number already registered. Please use a different phone number.'
          });
        }
      } catch (phoneCheckError) {
        console.error('Error checking phone number:', phoneCheckError);
        // Continue with registration even if phone check fails
      }
    }
    
    // Generate a valid username from email or name
    let username = email.split('@')[0];
    
    // Ensure username meets minimum length of 3 characters
    if (username.length < 3) {
      // Add random characters to make it at least 3 characters long
      const randomChars = Math.random().toString(36).substring(2, 5);
      username = username + randomChars;
    }
    
    // Create new user using our SQL model
    try {
      const user = await User.create({
        fullName: name,
        email,
        phone,
        username, // Use the generated valid username
        password, // Our model handles password hashing now
        // Mark email as verified for development convenience
        isEmailVerified: true,
        isPhoneVerified: phone ? false : true,
        role: 'customer'
      });
      
      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );
      
      // Return user info and tokens for immediate login
      res.status(201).json({ 
        success: true,
        message: 'Registration successful! You can now login with your account.',
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (createError) {
      console.error('User creation error:', createError);
      return res.status(500).json({ 
        success: false,
        message: 'Error creating user account. Please try again.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;
    
    // Find user with email using the correct model
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', user.id, user.email);
    
    // Verify password directly with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Log JWT secret information for debugging (first 10 chars only for security)
    console.log('Using JWT_SECRET starting with:', JWT_SECRET.substring(0, 10));
    console.log('Token generation for user:', user.id, 'with role:', user.role);
    
    // Generate access token with both userId and id for maximum compatibility
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Log successful token creation
    console.log('Access token generated successfully');
    
    // Generate refresh token with both userId and id for maximum compatibility
    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Log successful refresh token creation
    console.log('Refresh token generated successfully');
    
    // Update last login time
    await User.updateLoginTimestamp(user.id);
    
    // Set JWT as a cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // Also set refresh token as a cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    // Send response with both tokens
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.profileImage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, picture } = ticket.getPayload();
    
    // Find or create user with the correct model
    let user = await User.findByEmail(email);
    
    if (!user) {
      // Generate a valid username from email
      let username = email.split('@')[0];
      
      // Ensure username meets minimum length of 3 characters
      if (username.length < 3) {
        // Add random characters to make it at least 3 characters long
        const randomChars = Math.random().toString(36).substring(2, 5);
        username = username + randomChars;
      }
      
      // Create new user for Google login
      user = await User.create({
        fullName: name,
        email,
        username,
        profileImage: picture,
        isEmailVerified: true,
        socialProvider: 'google',
        socialId: email,
        role: 'customer'
      });
    } else {
      // Update existing user's Google info
      await User.update(
        {
          socialProvider: 'google',
          socialId: email,
          isEmailVerified: true,
          lastLogin: new Date()
        },
        { where: { id: user.id } }
      );
    }
    
    // Generate access token with both id and userId fields
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Generate refresh token with both id and userId fields
    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Update last login time
    await User.updateLoginTimestamp(user.id);
    
    // Send response with both tokens
    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.profileImage
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    // Verify Facebook token
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
    const data = await response.json();
    
    if (data.error) {
      return res.status(401).json({ message: 'Invalid Facebook token' });
    }
    
    const { email, name, picture } = data;
    
    // Find or create user with the correct model
    let user = await User.findByEmail(email);
    
    if (!user) {
      // Generate a valid username from email
      let username = email.split('@')[0];
      
      // Ensure username meets minimum length of 3 characters
      if (username.length < 3) {
        // Add random characters to make it at least 3 characters long
        const randomChars = Math.random().toString(36).substring(2, 5);
        username = username + randomChars;
      }
      
      // Create new user with the correct model
      user = await User.create({
        fullName: name,
        email,
        avatar: picture?.data?.url,
        username,
        isEmailVerified: true, // Facebook verified the email
        role: 'customer'
      });
    } else {
      // Update existing user's Facebook info with the correct model
      await User.update(
        {
          socialProvider: 'facebook',
          socialId: data.id,
          isEmailVerified: true,
          lastLogin: new Date()
        },
        { where: { id: user.id } }
      );
    }
    
    // Generate access token with both id and userId fields
    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Generate refresh token with both id and userId fields
    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Update last login time
    await User.updateLoginTimestamp(user.id);
    
    // Send response with both tokens
    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.profileImage
      }
    });
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Update user
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isEmailVerified = true;
    
    // If both email and phone (if required) are verified, set user as verified
    if (user.isEmailVerified && (!user.phone || user.isPhoneVerified)) {
      user.isVerified = true;
    }
    
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired verification token' });
  }
};

exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if OTP is valid and not expired
    if (!user.phoneVerificationOtp || 
        user.phoneVerificationOtp !== otp || 
        user.phoneVerificationExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update user
    user.isPhoneVerified = true;
    
    // If both email and phone are verified, set user as verified
    if (user.isEmailVerified && user.isPhoneVerified) {
      user.isVerified = true;
    }
    
    // Clear the OTP
    user.phoneVerificationOtp = null;
    user.phoneVerificationExpires = null;
    
    await user.save();
    
    res.status(200).json({ message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    // Generate new verification token
    const verificationToken = jwt.sign(
      { userId: user.id },
      JWT_EMAIL_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.fullName);
    
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Find user
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isPhoneVerified) {
      return res.status(400).json({ message: 'Phone already verified' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Update user with new OTP
    user.phoneVerificationOtp = otp;
    user.phoneVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await user.save();
    
    // Send OTP
    await sendPhoneVerificationOTP(phone, otp);
    
    res.status(200).json({ message: 'OTP sent to your phone' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    
    await user.save();
    
    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'UberEat - Reset Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello ${user.fullName},</p>
        <p>You requested to reset your password. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #FF5A5F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,</p>
        <p>UberEat Team</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { otp, userId, newPassword } = req.body;
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if OTP is valid and not expired
    if (!user.resetPasswordToken || 
        user.resetPasswordToken !== otp || 
        user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // If no refresh token in body, check cookies
    let token = refreshToken;
    if (!token && req.cookies && req.cookies.refresh_token) {
      token = req.cookies.refresh_token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No refresh token provided' 
      });
    }
    
    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired refresh token' 
      });
    }
    
    // Get user from database
    const userId = decoded.id || decoded.userId;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Generate new tokens
    const newAccessToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const newRefreshToken = jwt.sign(
      { id: user.id, userId: user.id, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Set new cookies
    res.cookie('jwt', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    // Return new tokens
    return res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred during token refresh' 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;
    
    // Update user profile using correct model
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields with User model's update method
    await User.update(
      {
        fullName: name || user.fullName,
        phone: phone || user.phone,
        address: address || user.address
      },
      { where: { id: userId } }
    );
    
    // Get updated user
    const updatedUser = await User.findByPk(userId);
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        avatar: updatedUser.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Find user using correct model
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password using bcrypt directly
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password using User model's update method
    await User.update(
      { password: newPassword }, // User model will hash the password
      { where: { id: userId } }
    );
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addFavoriteDish = async (req, res) => {
  try {
    const { dishId } = req.body;
    const userId = req.user.id;
    
    // Find user and update favorites
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.addFavoriteDish(dishId);
    
    res.status(200).json({ 
      message: 'Dish added to favorites',
      favoriteDishes: await user.getFavoriteDishes()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFavoriteDish = async (req, res) => {
  try {
    const { id: dishId } = req.params;
    const userId = req.user.id;
    
    // Find user and update favorites
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.removeFavoriteDish(dishId);
    
    res.status(200).json({ 
      message: 'Dish removed from favorites',
      favoriteDishes: await user.getFavoriteDishes()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFavoriteDishes = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user and populate favorite dishes
    const user = await User.findByPk(userId, {
      include: {
        model: User.associations.favoriteDishes,
        attributes: ['id', 'name', 'price', 'description', 'imageUrl']
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ favoriteDishes: user.favoriteDishes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user using correct model
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive data
    const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    
    res.status(200).json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Log logout attempt
    console.log('Logout request received');
    
    // Clear the JWT cookie with various path options to ensure it's removed
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    // Also clear the refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    // Also clear with alternative path to be sure
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin'
    });
    
    // Clear session if using passport
    if (req.logout) {
      req.logout();
    }
    
    // Log success
    console.log('Logout successful, cookies cleared');
    
    // Return success message
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error during logout'
    });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    // User will be attached to req.user by passport
    const user = req.user;
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

exports.facebookCallback = async (req, res) => {
  try {
    // User will be attached to req.user by passport
    const user = req.user;
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if OTP is valid and not expired
    if (!user.emailVerificationOtp || 
        user.emailVerificationOtp !== otp || 
        user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update user
    user.isEmailVerified = true;
    
    // If both email and phone (if required) are verified, set user as verified
    if (user.isEmailVerified && (!user.phone || user.isPhoneVerified)) {
      user.isVerified = true;
    }
    
    // Clear the email OTP
    user.emailVerificationOtp = null;
    user.emailVerificationExpires = null;
    
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Update user with new OTP
    user.emailVerificationOtp = otp;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await user.save();
    
    // Send verification email with OTP
    await sendVerificationEmailWithOTP(user.email, otp, user.fullName);
    
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra email đã tồn tại hay chưa
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Kiểm tra email trong cơ sở dữ liệu
    const existingEmail = await User.findByEmail(email);
    
    // Trả về kết quả
    res.status(200).json({ 
      exists: !!existingEmail
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Kiểm tra số điện thoại đã tồn tại hay chưa
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Kiểm tra số điện thoại trong cơ sở dữ liệu
    try {
      const sql = 'SELECT * FROM users WHERE phone = ?';
      const results = await db.query(sql, [phone]);
      
      // Trả về kết quả
      res.status(200).json({ 
        exists: results.length > 0
      });
    } catch (queryError) {
      console.error('Query error:', queryError);
      res.status(500).json({ message: 'Database query error' });
    }
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper Functions
function generateOTP() {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, token, name) {
  // Build verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  // Email options
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'UberEat - Verify Your Email',
    html: `
      <h1>Email Verification</h1>
      <p>Hello ${name},</p>
      <p>Thank you for registering with UberEat. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #FF5A5F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for an UberEat account, please ignore this email.</p>
      <p>Best regards,</p>
      <p>UberEat Team</p>
    `
  };
  
  // Send email
  await transporter.sendMail(mailOptions);
}

async function sendPhoneVerificationOTP(phone, otp) {
  // Send OTP via SMS using Twilio
  await twilioClient.messages.create({
    body: `Your UberEat verification code is: ${otp}. This code will expire in 15 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}

async function sendVerificationEmailWithOTP(email, otp, name) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'UberEat - Verify Your Email',
    html: `
      <h1>Email Verification</h1>
      <p>Hello ${name},</p>
      <p>Your email verification code is: ${otp}</p>
      <p>This code will expire in 24 hours.</p>
      <p>If you did not request this code, please ignore this email.</p>
      <p>Best regards,</p>
      <p>UberEat Team</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Get the JWT version - useful for clients to check if they need to re-authenticate
exports.getJwtVersion = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      jwtVersion: JWT_VERSION,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('JWT version check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking JWT version'
    });
  }
};