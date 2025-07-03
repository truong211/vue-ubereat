'use strict';

const { validationResult } = require('express-validator');
const AddressService = require('../services/address.service');
const { AppError } = require('../middleware/error.middleware');

/**
 * Helper to map request body camelCase -> snake_case expected by DB.
 */
function mapPayload(body) {
  return {
    recipient_name: body.recipientName || body.recipient_name || body.name,
    phone: body.phone,
    line1: body.addressLine1 || body.line1,
    ward: body.ward,
    district: body.district,
    province: body.province || body.state || body.city,
    note: body.note || body.instructions,
    is_default: body.isDefault !== undefined ? body.isDefault : body.is_default,
  };
}

exports.list = async (req, res, next) => {
  try {
    const addresses = await AddressService.list(req.user.id);
    res.status(200).json({ status: 'success', data: { addresses } });
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const address = await AddressService.get(req.user.id, req.params.id);
    if (!address) return next(new AppError('Address not found', 404));
    res.status(200).json({ status: 'success', data: { address } });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const payload = mapPayload(req.body);
    const address = await AddressService.create(req.user.id, payload);
    res.status(201).json({ status: 'success', data: { address } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const payload = mapPayload(req.body);
    const address = await AddressService.update(
      req.user.id,
      req.params.id,
      payload
    );
    if (!address) return next(new AppError('Address not found', 404));
    res.status(200).json({ status: 'success', data: { address } });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const success = await AddressService.remove(req.user.id, req.params.id);
    if (!success) return next(new AppError('Address not found', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.setDefault = async (req, res, next) => {
  try {
    const address = await AddressService.setDefault(req.user.id, req.params.id);
    if (!address) return next(new AppError('Address not found', 404));
    res.status(200).json({ status: 'success', data: { address } });
  } catch (err) {
    next(err);
  }
};

// Aliases for routes expecting old names
exports.getAddresses = exports.list;
exports.getAddress = exports.get;
exports.createAddress = exports.create;
exports.updateAddress = exports.update;
exports.deleteAddress = exports.remove;
exports.setDefaultAddress = exports.setDefault;

exports.getPlaces = async (req, res) => {
  // Placeholder: external autocomplete service integration can be added later.
  res.status(200).json({ status: 'success', data: { predictions: [] } });
};

exports.getPlaceDetails = async (req, res) => {
  res.status(200).json({ status: 'success', data: { place: {} } });
};