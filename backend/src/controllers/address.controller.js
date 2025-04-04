const { validationResult } = require('express-validator');
const db = require('../config/database');
const { AppError } = require('../middleware/error.middleware');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Helper function to get coordinates from address using external mapping service
 */
const getCoordinates = async (addressData) => {
  try {
    // Format the address for geocoding
    const addressString = `${addressData.addressLine1}, ${addressData.ward || ''} ${addressData.district || ''}, ${addressData.city}, ${addressData.state}, ${addressData.country}`;
    
    // Call Google Maps API or similar service
    // Note: In production, you should replace with actual API call
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: addressString,
        key: config.googleMaps.apiKey
      }
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address;
      const placeId = response.data.results[0].place_id;
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress,
        placeId
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting coordinates:', error);
    return null;
  }
};

/**
 * Get all addresses for the logged-in user
 * @route GET /api/addresses
 * @access Private
 */
exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC',
      [userId]
    );
    
    res.status(200).json({
      status: 'success',
      results: addresses.length,
      data: {
        addresses
      }
    });
  } catch (error) {
    logger.error('Error fetching addresses:', error);
    next(error);
  }
};

/**
 * Get a single address by ID
 * @route GET /api/addresses/:id
 * @access Private
 */
exports.getAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const [address] = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    logger.error('Error fetching address:', error);
    next(error);
  }
};

/**
 * Create a new address
 * @route POST /api/addresses
 * @access Private
 */
exports.createAddress = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
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
      hasElevator
    } = req.body;
    
    // If latitude and longitude are not provided, try to get them
    let locationData = {};
    if (!latitude || !longitude) {
      const coordinates = await getCoordinates({
        addressLine1,
        district,
        ward,
        city,
        state,
        country
      });
      
      if (coordinates) {
        locationData = coordinates;
      }
    } else {
      locationData = { latitude, longitude };
    }
    
    // If this is the default address, unset any existing default
    if (isDefault) {
      await db.query(
        'UPDATE addresses SET isDefault = false WHERE userId = ? AND isDefault = true',
        [userId]
      );
    }
    
    // Create the address
    const addressData = {
      userId,
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
      ...locationData,
      contactName,
      contactPhone,
      floor,
      apartmentNumber,
      hasElevator,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Build query
    const fields = Object.keys(addressData).join(', ');
    const placeholders = Object.keys(addressData).map(() => '?').join(', ');
    const values = Object.values(addressData);
    
    const result = await db.query(
      `INSERT INTO addresses (${fields}) VALUES (${placeholders})`,
      values
    );
    
    // Get the inserted address
    const [address] = await db.query(
      'SELECT * FROM addresses WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    logger.error('Error creating address:', error);
    next(error);
  }
};

/**
 * Update an address
 * @route PATCH /api/addresses/:id
 * @access Private
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // First, check if address exists and belongs to user
    const [existingAddress] = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    if (!existingAddress) {
      return next(new AppError('Address not found', 404));
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
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (ward !== undefined) updateData.ward = ward;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (country !== undefined) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (type !== undefined) updateData.type = type;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (floor !== undefined) updateData.floor = floor;
    if (apartmentNumber !== undefined) updateData.apartmentNumber = apartmentNumber;
    if (hasElevator !== undefined) updateData.hasElevator = hasElevator;
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    // If changing to default, update other addresses
    if (isDefault === true && !existingAddress.isDefault) {
      await db.query(
        'UPDATE addresses SET isDefault = false WHERE userId = ? AND isDefault = true',
        [userId]
      );
      updateData.isDefault = true;
    }
    
    // Construct update query
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          address: existingAddress
        }
      });
    }
    
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id, userId];
    
    await db.query(
      `UPDATE addresses SET ${setClauses} WHERE id = ? AND userId = ?`,
      values
    );
    
    // Get updated address
    const [updatedAddress] = await db.query(
      'SELECT * FROM addresses WHERE id = ?',
      [id]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        address: updatedAddress
      }
    });
  } catch (error) {
    logger.error('Error updating address:', error);
    next(error);
  }
};

/**
 * Delete an address
 * @route DELETE /api/addresses/:id
 * @access Private
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if address exists
    const [address] = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    // Delete the address
    await db.query(
      'DELETE FROM addresses WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    // If this was the default address, set another one as default
    if (address.isDefault) {
      const [anotherAddress] = await db.query(
        'SELECT id FROM addresses WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
        [userId]
      );
      
      if (anotherAddress) {
        await db.query(
          'UPDATE addresses SET isDefault = true WHERE id = ?',
          [anotherAddress.id]
        );
      }
    }
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Error deleting address:', error);
    next(error);
  }
};

/**
 * Set an address as default
 * @route PATCH /api/addresses/:id/default
 * @access Private
 */
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if address exists
    const [address] = await db.query(
      'SELECT * FROM addresses WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    // Remove default from all other addresses
    await db.query(
      'UPDATE addresses SET isDefault = false WHERE userId = ?',
      [userId]
    );
    
    // Set this address as default
    await db.query(
      'UPDATE addresses SET isDefault = true WHERE id = ?',
      [id]
    );
    
    // Get updated address
    const [updatedAddress] = await db.query(
      'SELECT * FROM addresses WHERE id = ?',
      [id]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        address: updatedAddress
      }
    });
  } catch (error) {
    logger.error('Error setting default address:', error);
    next(error);
  }
};

/**
 * Get places for address search suggestions
 * @route GET /api/addresses/places
 * @access Private
 */
exports.getPlaces = async (req, res, next) => {
  try {
    const { input } = req.query;
    
    if (!input) {
      return res.status(400).json({
        status: 'error',
        message: 'Input query is required'
      });
    }
    
    // Call Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        key: config.googleMaps.apiKey,
        language: 'vi',
        components: 'country:vn'
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        predictions: response.data.predictions || []
      }
    });
  } catch (error) {
    logger.error('Error fetching places:', error);
    next(error);
  }
};

/**
 * Get place details by place_id
 * @route GET /api/addresses/places/:placeId
 * @access Private
 */
exports.getPlaceDetails = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    
    // Call Google Place Details API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: config.googleMaps.apiKey,
        language: 'vi'
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        place: response.data.result || {}
      }
    });
  } catch (error) {
    logger.error('Error fetching place details:', error);
    next(error);
  }
}; 