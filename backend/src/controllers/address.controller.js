const { validationResult } = require('express-validator');
const { Address } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const axios = require('axios');
const config = require('../config/config');

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
    console.error('Error getting coordinates:', error);
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
    
    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      results: addresses.length,
      data: {
        addresses
      }
    });
  } catch (error) {
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
    
    const address = await Address.findOne({
      where: { id, userId }
    });
    
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
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }
    
    // Create the address
    const address = await Address.create({
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
      hasElevator
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
 * Update an address
 * @route PATCH /api/addresses/:id
 * @access Private
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the address
    let address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    // Extract only the fields that are allowed to be updated
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
    
    // Create update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (addressLine1) updateFields.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateFields.addressLine2 = addressLine2;
    if (city) updateFields.city = city;
    if (district !== undefined) updateFields.district = district;
    if (ward !== undefined) updateFields.ward = ward;
    if (state) updateFields.state = state;
    if (postalCode) updateFields.postalCode = postalCode;
    if (country) updateFields.country = country;
    if (phone !== undefined) updateFields.phone = phone;
    if (type) updateFields.type = type;
    if (instructions !== undefined) updateFields.instructions = instructions;
    if (contactName !== undefined) updateFields.contactName = contactName;
    if (contactPhone !== undefined) updateFields.contactPhone = contactPhone;
    if (floor !== undefined) updateFields.floor = floor;
    if (apartmentNumber !== undefined) updateFields.apartmentNumber = apartmentNumber;
    if (hasElevator !== undefined) updateFields.hasElevator = hasElevator;
    
    // Check if we need to update coordinates
    if ((addressLine1 && !latitude) || (addressLine1 && !longitude)) {
      const coordinates = await getCoordinates({
        addressLine1: addressLine1 || address.addressLine1,
        district: district || address.district,
        ward: ward || address.ward,
        city: city || address.city,
        state: state || address.state,
        country: country || address.country
      });
      
      if (coordinates) {
        updateFields.latitude = coordinates.latitude;
        updateFields.longitude = coordinates.longitude;
        updateFields.formattedAddress = coordinates.formattedAddress;
        updateFields.placeId = coordinates.placeId;
      }
    } else if (latitude !== undefined && longitude !== undefined) {
      updateFields.latitude = latitude;
      updateFields.longitude = longitude;
    }
    
    // If this is the default address, unset any existing default
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
      updateFields.isDefault = true;
    }
    
    // Update the address
    await address.update(updateFields);
    
    // Get the updated address
    address = await Address.findByPk(id);
    
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
 * Delete an address
 * @route DELETE /api/addresses/:id
 * @access Private
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the address
    const address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    // Check if this was the default address
    const wasDefault = address.isDefault;
    
    // Delete the address
    await address.destroy();
    
    // If this was the default address, set a new default if any addresses remain
    if (wasDefault) {
      const remainingAddress = await Address.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      
      if (remainingAddress) {
        await remainingAddress.update({ isDefault: true });
      }
    }
    
    res.status(204).send();
  } catch (error) {
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
    
    // Find the address
    const address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return next(new AppError('Address not found', 404));
    }
    
    // Unset any existing default
    await Address.update(
      { isDefault: false },
      { where: { userId, isDefault: true } }
    );
    
    // Set this address as default
    await address.update({ isDefault: true });
    
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
 * Get nearby places for address search suggestions
 * @route GET /api/addresses/places
 * @access Private
 */
exports.getPlaces = async (req, res, next) => {
  try {
    const { query, lat, lng, radius = 5000 } = req.query;
    
    if (!query) {
      return next(new AppError('Search query is required', 400));
    }
    
    let params = {
      input: query,
      key: config.googleMaps.apiKey,
      language: 'vi',
      components: 'country:vn'
    };
    
    // If lat and lng are provided, use them for location biasing
    if (lat && lng) {
      params.location = `${lat},${lng}`;
      params.radius = radius;
    }
    
    // Call Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params
    });
    
    if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
      res.status(200).json({
        status: 'success',
        results: response.data.predictions.length,
        data: {
          places: response.data.predictions
        }
      });
    } else {
      return next(new AppError('Error getting places', 500));
    }
  } catch (error) {
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
    
    if (!placeId) {
      return next(new AppError('Place ID is required', 400));
    }
    
    // Call Google Places API for details
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: config.googleMaps.apiKey,
        language: 'vi'
      }
    });
    
    if (response.data.status === 'OK') {
      // Extract the address components for easy frontend mapping
      const result = response.data.result;
      const addressComponents = {};
      
      if (result.address_components) {
        result.address_components.forEach(component => {
          if (component.types.includes('street_number')) {
            addressComponents.streetNumber = component.long_name;
          }
          if (component.types.includes('route')) {
            addressComponents.street = component.long_name;
          }
          if (component.types.includes('sublocality_level_1')) {
            addressComponents.ward = component.long_name;
          }
          if (component.types.includes('administrative_area_level_2')) {
            addressComponents.district = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            addressComponents.state = component.long_name;
          }
          if (component.types.includes('locality')) {
            addressComponents.city = component.long_name;
          }
          if (component.types.includes('country')) {
            addressComponents.country = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            addressComponents.postalCode = component.long_name;
          }
        });
      }
      
      // Format the address for the frontend
      const formattedPlace = {
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        location: result.geometry?.location,
        addressComponents,
        name: result.name,
        types: result.types
      };
      
      res.status(200).json({
        status: 'success',
        data: {
          place: formattedPlace
        }
      });
    } else {
      return next(new AppError('Error getting place details', 500));
    }
  } catch (error) {
    next(error);
  }
}; 