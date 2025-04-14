const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
// Import the password utility for consistent hashing
const { hashPassword, verifyPassword, SALT_ROUNDS } = require('../utils/password.util');

// Google OAuth configuration
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email or phone' 
      });
    }
    
    // Log original password for debugging
    console.log('--- DEBUG: Password Hashing on Registration ---');
    console.log('Original Password:', password);
    console.log('Original Password Length:', password ? password.length : 0);
    
    // Use the centralized password utility for hashing
    const hashedPassword = await hashPassword(password);
    
    console.log('Generated Hash Length:', hashedPassword.length);
    console.log('Generated Hash:', hashedPassword);
    
    // Create new user with the consistently hashed password
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      role: 'customer',
      verificationCode: {
        email: crypto.randomBytes(32).toString('hex'),
        phone: generateOTP(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    
    await user.save();
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_VERIFICATION_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.name);
    
    // Send phone verification if phone is provided
    if (phone) {
      await sendPhoneVerificationOTP(phone, user.verificationCode.phone);
    }
    
    res.status(201).json({ 
      message: 'User registered successfully. Please verify your email and phone.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Enhanced debug for login
    console.log('--- DEBUG: Login Password Verification ---');
    console.log('Login attempt for email:', email);
    console.log('Login Password:', password);
    console.log('Password length:', password ? password.length : 0);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      passwordLength: user.password ? user.password.length : 0
    });
    
    console.log('--- DEBUG: Pre-Comparison Values ---');
    console.log('Login Password:', password);
    console.log('Plaintext Password Length:', password ? password.length : 0);
    console.log('Stored Password Hash:', user.password);
    console.log('Stored Password Hash Length:', user.password ? user.password.length : 0);
    
    // Use the centralized password verification utility
    const isPasswordValid = await verifyPassword(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Login attempt failed: Invalid password for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Password is valid - check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Login successful for user:', email);
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
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
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        avatar: picture,
        isVerified: true, // Google verified the email
        role: 'customer'
      });
      
      await user.save();
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
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
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        avatar: picture?.data?.url,
        isVerified: true, // Facebook verified the email
        role: 'customer'
      });
      
      await user.save();
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);
    
    // Update user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.emailVerified = true;
    
    // If both email and phone (if required) are verified, set user as verified
    if (user.emailVerified && (!user.phone || user.phoneVerified)) {
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
    if (!user.verificationCode || 
        user.verificationCode.phone !== otp || 
        user.verificationCode.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update user
    user.phoneVerified = true;
    
    // If both email and phone are verified, set user as verified
    if (user.emailVerified && user.phoneVerified) {
      user.isVerified = true;
    }
    
    // Clear the OTP
    user.verificationCode.phone = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    // Generate new verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_VERIFICATION_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.name);
    
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Find user
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.phoneVerified) {
      return res.status(400).json({ message: 'Phone already verified' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Update user with new OTP
    user.verificationCode = {
      ...user.verificationCode,
      phone: otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };
    
    await user.save();
    
    // Send OTP
    await sendPhoneVerificationOTP(phone, otp);
    
    res.status(200).json({ message: 'OTP sent to your phone' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
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
      subject: 'UberEat - Đặt lại mật khẩu',
      html: `
        <h1>Yêu cầu đặt lại mật khẩu</h1>
        <p>Xin chào ${user.name},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu của bạn:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #FF5A5F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Đặt lại mật khẩu</a>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ UberEat</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Hash token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user with new password and clear token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  // Client-side logout - just return success message
  // Actual token invalidation should be handled by the client
  res.status(200).json({ message: 'Logged out successfully' });
};

// Alias for resendVerificationEmail to match routes
exports.resendEmailOTP = exports.resendVerificationEmail;

// Alias for forgotPassword to match routes
exports.requestPasswordReset = exports.forgotPassword;

// New methods to match routes

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if OTP is valid and not expired
    if (!user.verificationCode || 
        user.verificationCode.email !== otp || 
        user.verificationCode.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update user
    user.emailVerified = true;
    
    // If both email and phone (if required) are verified, set user as verified
    if (user.emailVerified && (!user.phone || user.phoneVerified)) {
      user.isVerified = true;
    }
    
    // Clear the email OTP
    user.verificationCode.email = undefined;
    
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user
    const user = await User.findById(userId)
      .select('-password -verificationCode -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;
    
    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, address },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatar: user.avatar
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
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteDishes: dishId } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Dish added to favorites',
      favoriteDishes: user.favoriteDishes
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteDishes: dishId } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Dish removed from favorites',
      favoriteDishes: user.favoriteDishes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFavoriteDishes = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user and populate favorite dishes
    const user = await User.findById(userId)
      .populate('favoriteDishes')
      .select('favoriteDishes');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ favoriteDishes: user.favoriteDishes });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    subject: 'UberEat - Xác thực địa chỉ email',
    html: `
      <h1>Xác thực địa chỉ email</h1>
      <p>Xin chào ${name},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản UberEat. Vui lòng nhấp vào liên kết dưới đây để xác thực địa chỉ email của bạn:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #FF5A5F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Xác thực email</a>
      <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
      <p>Nếu bạn không đăng ký tài khoản UberEat, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ UberEat</p>
    `
  };
  
  // Send email
  await transporter.sendMail(mailOptions);
}

async function sendPhoneVerificationOTP(phone, otp) {
  // Send OTP via SMS using Twilio
  await twilioClient.messages.create({
    body: `Mã xác thực UberEat của bạn là: ${otp}. Mã này sẽ hết hạn sau 15 phút.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}
