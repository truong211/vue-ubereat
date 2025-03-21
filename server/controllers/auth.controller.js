const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');

// ...existing code...

// Google OAuth configuration
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      role: 'customer'
    });
    
    await user.save();
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_VERIFICATION_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send verification email (to be implemented)
    // sendVerificationEmail(user.email, verificationToken);
    
    res.status(201).json({ 
      message: 'User registered successfully. Please verify your email.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is verified
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
    await User.findByIdAndUpdate(decoded.userId, { isVerified: true });
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired verification token' });
  }
};

exports.logout = async (req, res) => {
  // Client-side logout - just return success message
  // Actual token invalidation should be handled by the client
  res.status(200).json({ message: 'Logged out successfully' });
};
