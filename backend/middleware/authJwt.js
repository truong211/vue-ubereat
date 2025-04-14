const jwt = require('jsonwebtoken');
const config = require('../src/config');
const User = require('../models/user.model');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.id;
    req.userRole = decoded.role;

    // Check if user still exists and is active
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Failed to authenticate token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  next();
};

const isRestaurant = (req, res, next) => {
  if (req.userRole !== 'restaurant') {
    return res.status(403).json({ message: 'Require Restaurant Role!' });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.userRole !== 'customer') {
    return res.status(403).json({ message: 'Require Customer Role!' });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isRestaurant,
  isCustomer
}; 