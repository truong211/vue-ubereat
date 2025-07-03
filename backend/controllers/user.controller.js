const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Remove sensitive information
    const { password, resetPasswordOtp, resetPasswordExpires, emailVerificationOtp, emailVerificationExpires, phoneVerificationOtp, phoneVerificationExpires, verificationToken, socialToken, ...profile } = user;

    res.json({
      success: true,
      data: {
        profile
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { fullName, email, phone, address, preferredLanguage, notificationPreferences } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email này đã được sử dụng bởi người dùng khác'
        });
      }
    }

    // Check if phone is already taken by another user
    if (phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại này đã được sử dụng bởi người dùng khác'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = JSON.stringify(notificationPreferences);

    // Update user profile
    const updated = await User.update(userId, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Get updated user data
    const updatedUser = await User.findByPk(userId);
    const { password, resetPasswordOtp, resetPasswordExpires, emailVerificationOtp, emailVerificationExpires, phoneVerificationOtp, phoneVerificationExpires, verificationToken, socialToken, ...profile } = updatedUser;

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        profile
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Upload user avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh để tải lên'
      });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      // Clean up uploaded file if user not found
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Delete old avatar if exists
    if (user.profileImage) {
      const oldAvatarPath = path.join(__dirname, '../../', user.profileImage);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.log('Old avatar file not found or could not be deleted:', error.message);
      }
    }

    // Update user with new avatar path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await User.update(userId, { profileImage: avatarPath });

    res.json({
      success: true,
      message: 'Tải lên ảnh đại diện thành công',
      data: {
        profileImage: avatarPath
      }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh đại diện'
    });
  }
};

/**
 * Remove user avatar
 */
const removeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    if (user.profileImage) {
      // Delete avatar file
      const avatarPath = path.join(__dirname, '../../', user.profileImage);
      try {
        await fs.unlink(avatarPath);
      } catch (error) {
        console.log('Avatar file not found or could not be deleted:', error.message);
      }

      // Update user record
      await User.update(userId, { profileImage: null });
    }

    res.json({
      success: true,
      message: 'Xóa ảnh đại diện thành công'
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa ảnh đại diện'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar
};