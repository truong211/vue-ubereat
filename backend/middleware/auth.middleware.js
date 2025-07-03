const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập, vui lòng đăng nhập'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Yêu cầu quyền quản trị viên'
    });
  }
};

/**
 * Middleware to check if user has restaurant owner role
 */
const isRestaurantOwner = (req, res, next) => {
  if (req.user && (req.user.role === 'restaurant' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Yêu cầu quyền chủ nhà hàng'
    });
  }
};

/**
 * Middleware to check if user has driver role
 */
const isDriver = (req, res, next) => {
  if (req.user && (req.user.role === 'driver' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Yêu cầu quyền tài xế'
    });
  }
};

module.exports = {
  protect,
  isAdmin,
  isRestaurantOwner,
  isDriver
};