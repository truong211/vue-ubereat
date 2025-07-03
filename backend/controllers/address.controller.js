const db = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all addresses for current user
 */
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC',
      [userId]
    );

    res.json({
      success: true,
      data: {
        addresses
      }
    });
  } catch (error) {
    console.error('Error getting user addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Create new address
 */
const createAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const {
      name,
      addressLine1,
      addressLine2,
      city,
      district,
      ward,
      state,
      postalCode,
      country = 'Vietnam',
      phone,
      isDefault = false,
      type = 'home',
      instructions,
      latitude,
      longitude,
      contactName,
      contactPhone,
      floor,
      apartmentNumber,
      hasElevator = true
    } = req.body;

    const userId = req.user.id;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await db.query(
        'UPDATE addresses SET isDefault = FALSE WHERE userId = ?',
        [userId]
      );
    }

    // Create new address
    const result = await db.query(
      `INSERT INTO addresses (
        userId, name, addressLine1, addressLine2, city, district, ward, state, 
        postalCode, country, phone, isDefault, type, instructions, latitude, 
        longitude, contactName, contactPhone, floor, apartmentNumber, hasElevator,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId, name, addressLine1, addressLine2, city, district, ward, state,
        postalCode, country, phone, isDefault, type, instructions, latitude,
        longitude, contactName, contactPhone, floor, apartmentNumber, hasElevator
      ]
    );

    // Get the created address
    const newAddress = await db.query(
      'SELECT * FROM addresses WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo địa chỉ thành công',
      data: {
        address: newAddress[0]
      }
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Get single address
 */
const getAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    const address = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    if (address.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại'
      });
    }

    res.json({
      success: true,
      data: {
        address: address[0]
      }
    });
  } catch (error) {
    console.error('Error getting address:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Update address
 */
const updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const addressId = req.params.id;
    const userId = req.user.id;
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      district,
      ward,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      type,
      instructions,
      latitude,
      longitude,
      contactName,
      contactPhone,
      floor,
      apartmentNumber,
      hasElevator
    } = req.body;

    // Check if address exists and belongs to user
    const existingAddress = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại'
      });
    }

    // If this is set as default, unset other default addresses
    if (isDefault && !existingAddress[0].isDefault) {
      await db.query(
        'UPDATE addresses SET isDefault = FALSE WHERE userId = ? AND id != ?',
        [userId, addressId]
      );
    }

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (addressLine1 !== undefined) {
      updateFields.push('addressLine1 = ?');
      updateValues.push(addressLine1);
    }
    if (addressLine2 !== undefined) {
      updateFields.push('addressLine2 = ?');
      updateValues.push(addressLine2);
    }
    if (city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(city);
    }
    if (district !== undefined) {
      updateFields.push('district = ?');
      updateValues.push(district);
    }
    if (ward !== undefined) {
      updateFields.push('ward = ?');
      updateValues.push(ward);
    }
    if (state !== undefined) {
      updateFields.push('state = ?');
      updateValues.push(state);
    }
    if (postalCode !== undefined) {
      updateFields.push('postalCode = ?');
      updateValues.push(postalCode);
    }
    if (country !== undefined) {
      updateFields.push('country = ?');
      updateValues.push(country);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (isDefault !== undefined) {
      updateFields.push('isDefault = ?');
      updateValues.push(isDefault);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (instructions !== undefined) {
      updateFields.push('instructions = ?');
      updateValues.push(instructions);
    }
    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      updateValues.push(latitude);
    }
    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      updateValues.push(longitude);
    }
    if (contactName !== undefined) {
      updateFields.push('contactName = ?');
      updateValues.push(contactName);
    }
    if (contactPhone !== undefined) {
      updateFields.push('contactPhone = ?');
      updateValues.push(contactPhone);
    }
    if (floor !== undefined) {
      updateFields.push('floor = ?');
      updateValues.push(floor);
    }
    if (apartmentNumber !== undefined) {
      updateFields.push('apartmentNumber = ?');
      updateValues.push(apartmentNumber);
    }
    if (hasElevator !== undefined) {
      updateFields.push('hasElevator = ?');
      updateValues.push(hasElevator);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(addressId, userId);

    // Update address
    await db.query(
      `UPDATE addresses SET ${updateFields.join(', ')} WHERE id = ? AND userId = ?`,
      updateValues
    );

    // Get updated address
    const updatedAddress = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    res.json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      data: {
        address: updatedAddress[0]
      }
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Delete address
 */
const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    // Check if address exists and belongs to user
    const existingAddress = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại'
      });
    }

    // Delete address
    await db.query(
      'DELETE FROM addresses WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    // If this was the default address, set another address as default
    if (existingAddress[0].isDefault) {
      const remainingAddresses = await db.query(
        'SELECT * FROM addresses WHERE userId = ? ORDER BY createdAt ASC LIMIT 1',
        [userId]
      );

      if (remainingAddresses.length > 0) {
        await db.query(
          'UPDATE addresses SET isDefault = TRUE WHERE id = ?',
          [remainingAddresses[0].id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Xóa địa chỉ thành công'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

/**
 * Set address as default
 */
const setDefaultAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    // Check if address exists and belongs to user
    const existingAddress = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại'
      });
    }

    // Unset all default addresses for user
    await db.query(
      'UPDATE addresses SET isDefault = FALSE WHERE userId = ?',
      [userId]
    );

    // Set this address as default
    await db.query(
      'UPDATE addresses SET isDefault = TRUE, updatedAt = NOW() WHERE id = ? AND userId = ?',
      [addressId, userId]
    );

    res.json({
      success: true,
      message: 'Đặt địa chỉ mặc định thành công'
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

module.exports = {
  getUserAddresses,
  createAddress,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};