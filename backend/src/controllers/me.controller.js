const { validationResult } = require('express-validator');
const UserProfile = require('../../models/userProfile');
const Address = require('../../models/address');
const { AppError } = require('../middleware/error.middleware');

/**
 * GET /api/v1/me
 * Return authenticated user's profile (excluding sensitive fields)
 */
exports.viewProfile = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.user_id || req.user.userId);
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const user = await UserProfile.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/me
 * Update profile fields: full_name, email, phone, avatar_url
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user && (req.user.id || req.user.user_id || req.user.userId);
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const allowedFields = ['full_name', 'email', 'phone', 'avatar_url'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
    }

    await UserProfile.update(updateData, { id: userId });
    const updatedUser = await UserProfile.findByPk(userId);
    res.status(200).json({ status: 'success', data: updatedUser });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/me/addresses
 */
exports.listAddresses = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.user_id || req.user.userId);
    const addresses = await Address.findAll({ where: { user_id: userId }, order: [['is_default', 'DESC'], ['created_at', 'DESC']] });
    res.status(200).json({ status: 'success', results: addresses.length, data: addresses });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/me/addresses
 */
exports.createAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user && (req.user.id || req.user.user_id || req.user.userId);
    const {
      label,
      full_address,
      province,
      district,
      ward,
      latitude,
      longitude,
      is_default
    } = req.body;

    // If set as default, unset old default addresses
    if (is_default) {
      await Address.update({ is_default: false }, { user_id: userId });
    }

    const newAddress = await Address.create({
      user_id: userId,
      label,
      full_address,
      province,
      district,
      ward,
      latitude,
      longitude,
      is_default: Boolean(is_default)
    });

    res.status(201).json({ status: 'success', data: newAddress });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/me/addresses/:id
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user && (req.user.id || req.user.user_id || req.user.userId);

    // Verify address belongs to user
    const address = await Address.findByPk(id);
    if (!address || address.user_id !== userId) {
      return next(new AppError('Address not found', 404));
    }

    const allowedFields = ['label', 'full_address', 'province', 'district', 'ward', 'latitude', 'longitude', 'is_default'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
    }

    if (updateData.is_default === true) {
      await Address.update({ is_default: false }, { user_id: userId });
    }

    await Address.update(updateData, { id });
    const updated = await Address.findByPk(id);
    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/me/addresses/:id
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user && (req.user.id || req.user.user_id || req.user.userId);

    const address = await Address.findByPk(id);
    if (!address || address.user_id !== userId) {
      return next(new AppError('Address not found', 404));
    }

    await Address.destroy({ id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};