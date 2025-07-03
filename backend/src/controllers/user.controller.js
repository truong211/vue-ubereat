const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const { AppError } = require('../middleware/error.middleware');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get users with optional role filtering
 * @route GET /api/users
 * @access Public with optional auth
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { roles } = req.query;
    let conditions = [];
    let params = [];
    
    // Build conditions based on query parameters
    if (roles) {
      const roleArray = roles.split(',');
      const placeholders = roleArray.map(() => '?').join(',');
      conditions.push(`role IN (${placeholders})`);
      params.push(...roleArray);
    }
    
    // Only show active users by default
    conditions.push('isActive = ?');
    params.push(true);
    
    // Build the WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Execute the query
    const query = `
      SELECT id, username, email, fullName, phone, role, profileImage, createdAt, updatedAt 
      FROM users 
      ${whereClause} 
      ORDER BY fullName ASC
    `;
    
    const users = await db.query(query, params);
    
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    // Fetch basic user info (excluding password)
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.password !== undefined) {
      delete user.password;
    }

    // Fetch this user's addresses separately
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC',
      [req.user.id]
    );

    // Attach addresses for convenience (mimicking include behavior)
    user.addresses = addresses;

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PATCH /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, address } = req.body;
    const userId = req.user.id;
    
    // Create update data object
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    
    // Use User.update method correctly - it expects (id, data) not ({data}, {where})
    const updated = await User.update(userId, updateData);
    
    if (!updated) {
      return next(new AppError('Failed to update user profile', 500));
    }
    
    // Fetch the updated user record
    const updatedUser = await User.findByPk(userId);

    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
};

/**
 * Upload profile image
 * @route POST /api/users/profile/image
 * @access Private
 */
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image', 400));
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Use User.update method to update the profile image
    const updated = await User.update(userId, {
      profileImage: req.file.filename
    });
    
    if (!updated) {
      return next(new AppError('Failed to update profile image', 500));
    }
    
    // Fetch the updated user record
    const updatedUser = await User.findByPk(userId);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
        message: 'Profile image updated successfully'
      }
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

/**
 * Get user addresses
 * @route GET /api/users/addresses
 * @access Private
 */
exports.getAddresses = async (req, res, next) => {
  try {
    // Use direct SQL query instead of Sequelize models
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      results: addresses.length,
      data: {
        addresses
      }
    });
  } catch (error) {
    logger.error('Error fetching user addresses:', error);
    next(error);
  }
};

/**
 * Add new address
 * @route POST /api/users/addresses
 * @access Private
 */
exports.addAddress = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      type,
      instructions,
      latitude,
      longitude
    } = req.body;

    // If this is the default address, unset any existing default
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }

    // Create new address
    const address = await Address.create({
      userId: req.user.id,
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: isDefault || false,
      type: type || 'home',
      instructions,
      latitude,
      longitude
    });

    res.status(201).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 * @route PATCH /api/users/addresses/:id
 * @access Private
 */
exports.updateAddress = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      type,
      instructions,
      latitude,
      longitude
    } = req.body;

    // Find address
    const address = await Address.findOne({
      where: { id, userId: req.user.id }
    });

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    // If this is being set as default, unset any existing default
    if (isDefault && !address.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }

    // Update address
    address.name = name || address.name;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2 || address.addressLine2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.phone = phone || address.phone;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;
    address.type = type || address.type;
    address.instructions = instructions || address.instructions;
    address.latitude = latitude || address.latitude;
    address.longitude = longitude || address.longitude;

    await address.save();

    res.status(200).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 * @route DELETE /api/users/addresses/:id
 * @access Private
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find address
    const address = await Address.findOne({
      where: { id, userId: req.user.id }
    });

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    // Delete address
    await address.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user orders
 * @route GET /api/users/orders
 * @access Private
 */
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          association: 'restaurant',
          attributes: ['id', 'name', 'logo']
        },
        {
          association: 'orderDetails',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order details
 * @route GET /api/users/orders/:id
 * @access Private
 */
exports.getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId: req.user.id },
      include: [
        {
          association: 'restaurant',
          attributes: ['id', 'name', 'logo', 'address', 'phone']
        },
        {
          association: 'orderDetails',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'description', 'image', 'price']
            }
          ]
        },
        {
          association: 'driver',
          attributes: ['id', 'fullName', 'phone', 'profileImage']
        }
      ]
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};