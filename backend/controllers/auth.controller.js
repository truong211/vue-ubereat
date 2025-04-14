const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../src/config');
const { verifyPassword } = require('../src/utils/password.util');

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error while fetching user data' });
  }
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs with expiration (in a real app, this should be in a database)
const otpStore = new Map();

// Register a new user
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, phone, password, username } = req.body;
    // Debug: Log received password and its length
    console.log('[REGISTER] Received password:', password, '| Length:', password ? password.length : 0);

    // Generate a username from email if not provided
    const generatedUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { email },
          { phone },
          { username: generatedUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      if (existingUser.phone === phone) {
        return res.status(409).json({ message: 'Phone number already registered' });
      }
    }

    // Create user with pending verification status
    // Use the create method from the User model which handles password hashing consistently
    const user = await User.create({
      name,
      email,
      phone,
      username: generatedUsername,
      password: password, // The User.create method will hash this
      status: 'pending',
      role: 'customer'
    });

    // Debug: Log the generated hash for the password
    const createdUser = await User.findOne({ where: { email } });
    if (createdUser) {
      console.log('[REGISTER] Generated Hash:', {
        password: password,
        hash: createdUser.password,
        hashLength: createdUser.password ? createdUser.password.length : 0
      });
    }

    // Generate OTP for phone verification if phone is provided
    let otp;
    if (phone) {
      otp = generateOTP();

      // In a real app, you would send this OTP via SMS using a service like Twilio
      // For demo purposes, just store it with 5 minutes expiration
      otpStore.set(phone, {
        otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      });

      console.log(`OTP for ${phone}: ${otp}`); // For development only, remove in production
    }

    // Return success with verification required flag only if phone is provided
    return res.status(201).json({
      success: true,
      message: phone
        ? 'Registration successful. Verification required.'
        : 'Registration successful! You can now login with your account.',
      verificationRequired: !!phone, // Only require verification if phone is provided
      // Include the user object for consistency, even if pending verification
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status // Include status ('pending')
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// Verify phone OTP
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // Check if OTP exists and is valid
    const otpData = otpStore.get(phone);
    if (!otpData || otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }

    // OTP is valid, update user status
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user status to active
    user.status = 'active';
    await user.save();

    // Clear OTP
    otpStore.delete(phone);

    // Generate JWT tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.refreshTokenSecret,
      { expiresIn: '7d' }
    );

    // Return user data and tokens
    return res.status(200).json({
      success: true,
      message: 'Phone verification successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    return res.status(500).json({ message: 'Server error during verification' });
  }
};

// Resend phone OTP
exports.resendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if user exists
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();

    // In a real app, you would send this OTP via SMS
    // For demo purposes, just store it with 5 minutes expiration
    otpStore.set(phone, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    console.log(`New OTP for ${phone}: ${otp}`); // For development only

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ message: 'Server error during OTP resend' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    
    // Find user with complete profile including password hash
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Log found user details for debugging
    console.log('User found:', { 
      id: user.id, 
      email: user.email, 
      passwordLength: user.password ? user.password.length : 0 
    });

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Use the utility function directly for maximum reliability
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.log('Login attempt failed: Invalid password for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login timestamp
    await User.update({ lastLogin: new Date() }, { where: { id: user.id } });

    // Generate JWT tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.refreshTokenSecret,
      { expiresIn: '7d' }
    );

    console.log('Login successful for:', email);

    // Return user data and tokens
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.fullName || user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Logout (in a real app, you might want to invalidate tokens)
exports.logout = (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);

    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new access token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};