const { validationResult } = require('express-validator');
const { Restaurant, DeliveryConfig, Order } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const catchAsync = require('../utils/catchAsync');
const axios = require('axios');

/**
 * Geocode an address to get coordinates
 * @route POST /api/map/geocode
 * @access Public
 */
exports.geocodeAddress = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { address } = req.body;

  try {
    // Use Google Geocoding API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return next(new AppError('Google Maps API key not configured', 500));
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey,
        language: 'vi',
        region: 'VN'
      }
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      return next(new AppError('Không thể tìm thấy địa chỉ', 404));
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    res.status(200).json({
      status: 'success',
      data: {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        address_components: result.address_components
      }
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return next(new AppError('Lỗi khi geocode địa chỉ', 500));
  }
});

/**
 * Reverse geocode coordinates to get address
 * @route POST /api/map/reverse-geocode
 * @access Public
 */
exports.reverseGeocode = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { lat, lng } = req.body;

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return next(new AppError('Google Maps API key not configured', 500));
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: apiKey,
        language: 'vi',
        region: 'VN'
      }
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      return next(new AppError('Không thể tìm thấy địa chỉ cho tọa độ này', 404));
    }

    const result = response.data.results[0];

    res.status(200).json({
      status: 'success',
      data: {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        address_components: result.address_components
      }
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return next(new AppError('Lỗi khi reverse geocode tọa độ', 500));
  }
});

/**
 * Calculate distance between two points
 * @route POST /api/map/distance
 * @access Public
 */
exports.calculateDistance = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { origin, destination } = req.body;

  // Calculate straight-line distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(destination.lat - origin.lat);
  const dLon = deg2rad(destination.lng - origin.lng);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(origin.lat)) * Math.cos(deg2rad(destination.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLineDistance = R * c;

  try {
    // Also get driving distance from Google Maps Distance Matrix API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let drivingDistance = null;
    let drivingDuration = null;

    if (apiKey) {
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key: apiKey,
          mode: 'driving',
          language: 'vi',
          units: 'metric'
        }
      });

      if (response.data.status === 'OK' && 
          response.data.rows[0] && 
          response.data.rows[0].elements[0].status === 'OK') {
        const element = response.data.rows[0].elements[0];
        drivingDistance = element.distance.value / 1000; // Convert to km
        drivingDuration = element.duration.value / 60; // Convert to minutes
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        straightLineDistance: parseFloat(straightLineDistance.toFixed(2)),
        drivingDistance: drivingDistance ? parseFloat(drivingDistance.toFixed(2)) : null,
        drivingDuration: drivingDuration ? Math.round(drivingDuration) : null,
        units: {
          distance: 'km',
          duration: 'minutes'
        }
      }
    });
  } catch (error) {
    console.error('Distance calculation error:', error);
    // Return at least the straight-line distance
    res.status(200).json({
      status: 'success',
      data: {
        straightLineDistance: parseFloat(straightLineDistance.toFixed(2)),
        drivingDistance: null,
        drivingDuration: null,
        units: {
          distance: 'km',
          duration: 'minutes'
        }
      }
    });
  }
});

/**
 * Get directions between two points
 * @route POST /api/map/directions
 * @access Public
 */
exports.getDirections = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { origin, destination, travelMode = 'DRIVING' } = req.body;

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return next(new AppError('Google Maps API key not configured', 500));
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: apiKey,
        mode: travelMode.toLowerCase(),
        language: 'vi',
        region: 'VN'
      }
    });

    if (response.data.status !== 'OK' || !response.data.routes.length) {
      return next(new AppError('Không thể tìm được đường đi', 404));
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    res.status(200).json({
      status: 'success',
      data: {
        distance: {
          text: leg.distance.text,
          value: leg.distance.value
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value
        },
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          instructions: step.html_instructions.replace(/<[^>]*>/g, ''),
          start_location: step.start_location,
          end_location: step.end_location
        })),
        polyline: route.overview_polyline.points
      }
    });
  } catch (error) {
    console.error('Directions error:', error);
    return next(new AppError('Lỗi khi lấy chỉ đường', 500));
  }
});

/**
 * Get nearby restaurants based on location
 * @route GET /api/map/restaurants/nearby
 * @access Public
 */
exports.getNearbyRestaurants = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { lat, lng, radius = 10 } = req.query;

  try {
    // Get restaurants with their locations
    const restaurants = await Restaurant.findAll({
      where: {
        isActive: true
      },
      attributes: [
        'id', 'name', 'thumbnail', 'rating', 'reviewCount', 
        'cuisineType', 'lat', 'lng', 'address', 'phone',
        'openTime', 'closeTime', 'deliveryTime', 'isOpen'
      ]
    });

    // Filter restaurants within radius and calculate distances
    const nearbyRestaurants = restaurants
      .map(restaurant => {
        if (!restaurant.lat || !restaurant.lng) return null;
        
        const distance = calculateDistance(
          { lat: parseFloat(lat), lng: parseFloat(lng) },
          { lat: restaurant.lat, lng: restaurant.lng }
        );
        
        return {
          ...restaurant.toJSON(),
          distance: parseFloat(distance.toFixed(2))
        };
      })
      .filter(restaurant => restaurant && restaurant.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      status: 'success',
      results: nearbyRestaurants.length,
      data: nearbyRestaurants
    });
  } catch (error) {
    console.error('Get nearby restaurants error:', error);
    return next(new AppError('Lỗi khi lấy danh sách nhà hàng gần đây', 500));
  }
});

/**
 * Get restaurant locations for map display
 * @route GET /api/map/restaurants/locations
 * @access Public
 */
exports.getRestaurantLocations = catchAsync(async (req, res, next) => {
  const { bounds } = req.query;

  try {
    let whereClause = {
      isActive: true,
      lat: { [require('sequelize').Op.not]: null },
      lng: { [require('sequelize').Op.not]: null }
    };

    // If bounds provided, filter restaurants within bounds
    if (bounds && bounds.ne && bounds.sw) {
      whereClause.lat = {
        [require('sequelize').Op.between]: [
          parseFloat(bounds.sw.lat),
          parseFloat(bounds.ne.lat)
        ]
      };
      whereClause.lng = {
        [require('sequelize').Op.between]: [
          parseFloat(bounds.sw.lng),
          parseFloat(bounds.ne.lng)
        ]
      };
    }

    const restaurants = await Restaurant.findAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'thumbnail', 'rating', 'reviewCount',
        'cuisineType', 'lat', 'lng', 'address', 'deliveryTime',
        'isOpen', 'deliveryRadius'
      ]
    });

    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error('Get restaurant locations error:', error);
    return next(new AppError('Lỗi khi lấy vị trí nhà hàng', 500));
  }
});

/**
 * Check if location is in delivery zone
 * @route POST /api/map/delivery-zone/check
 * @access Public
 */
exports.checkDeliveryZone = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { restaurantId, userLocation } = req.body;

  try {
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return next(new AppError('Nhà hàng không tồn tại', 404));
    }

    if (!restaurant.lat || !restaurant.lng) {
      return next(new AppError('Nhà hàng chưa có thông tin vị trí', 400));
    }

    // Calculate distance
    const distance = calculateDistance(
      userLocation,
      { lat: restaurant.lat, lng: restaurant.lng }
    );

    // Get delivery config for this restaurant
    const deliveryConfig = await DeliveryConfig.findOne({
      where: { restaurantId }
    });

    // Use restaurant's delivery radius or default from config
    const maxDeliveryDistance = deliveryConfig 
      ? deliveryConfig.maxDeliveryDistance 
      : restaurant.deliveryRadius || 10;

    const canDeliver = distance <= maxDeliveryDistance;

    res.status(200).json({
      status: 'success',
      data: {
        canDeliver,
        distance: parseFloat(distance.toFixed(2)),
        maxDeliveryDistance,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          location: {
            lat: restaurant.lat,
            lng: restaurant.lng
          }
        }
      }
    });
  } catch (error) {
    console.error('Check delivery zone error:', error);
    return next(new AppError('Lỗi khi kiểm tra vùng giao hàng', 500));
  }
});

/**
 * Get delivery zones for a restaurant
 * @route GET /api/map/delivery-zones/:restaurantId
 * @access Public
 */
exports.getRestaurantDeliveryZones = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  try {
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return next(new AppError('Nhà hàng không tồn tại', 404));
    }

    const deliveryConfig = await DeliveryConfig.findOne({
      where: { restaurantId },
      include: [{
        model: require('../models').DeliveryFeeTier,
        as: 'feeTiers',
        order: [['displayOrder', 'ASC']]
      }]
    });

    const maxRadius = deliveryConfig 
      ? deliveryConfig.maxDeliveryDistance 
      : restaurant.deliveryRadius || 10;

    // Create zones based on fee tiers or default zones
    let zones = [];
    if (deliveryConfig && deliveryConfig.feeTiers && deliveryConfig.feeTiers.length > 0) {
      zones = deliveryConfig.feeTiers.map(tier => ({
        minDistance: tier.minDistance,
        maxDistance: tier.maxDistance,
        fee: tier.fee,
        color: getZoneColor(tier.displayOrder)
      }));
    } else {
      // Default zones
      zones = [
        { minDistance: 0, maxDistance: 2, fee: 15000, color: '#4CAF50' },
        { minDistance: 2, maxDistance: 5, fee: 25000, color: '#FF9800' },
        { minDistance: 5, maxDistance: maxRadius, fee: 35000, color: '#F44336' }
      ];
    }

    res.status(200).json({
      status: 'success',
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          location: {
            lat: restaurant.lat,
            lng: restaurant.lng
          }
        },
        maxDeliveryDistance: maxRadius,
        zones
      }
    });
  } catch (error) {
    console.error('Get delivery zones error:', error);
    return next(new AppError('Lỗi khi lấy thông tin vùng giao hàng', 500));
  }
});

/**
 * Calculate estimated delivery time
 * @route POST /api/map/eta/calculate
 * @access Public
 */
exports.calculateETA = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { restaurantLocation, userLocation, orderStatus = 'preparing' } = req.body;

  try {
    const distance = calculateDistance(restaurantLocation, userLocation);
    
    let preparationTime = 0;
    switch (orderStatus) {
      case 'preparing':
        preparationTime = 20; // 20 minutes
        break;
      case 'ready_for_pickup':
        preparationTime = 5; // 5 minutes
        break;
      case 'out_for_delivery':
        preparationTime = 0; // Already on the way
        break;
      default:
        preparationTime = 25; // Default
    }

    // Estimate delivery time (25 km/h average speed in city)
    const travelTime = (distance / 25) * 60; // Convert to minutes
    const totalTime = preparationTime + travelTime;
    
    const estimatedDeliveryTime = new Date(Date.now() + totalTime * 60 * 1000);

    res.status(200).json({
      status: 'success',
      data: {
        distance: parseFloat(distance.toFixed(2)),
        preparationTime,
        travelTime: Math.ceil(travelTime),
        totalTime: Math.ceil(totalTime),
        estimatedDeliveryTime: estimatedDeliveryTime.toISOString()
      }
    });
  } catch (error) {
    console.error('Calculate ETA error:', error);
    return next(new AppError('Lỗi khi tính toán thời gian giao hàng', 500));
  }
});

/**
 * Update ETA based on real-time traffic
 * @route POST /api/map/eta/update
 * @access Private
 */
exports.updateETAWithTraffic = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId, currentLocation } = req.body;

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return next(new AppError('Đơn hàng không tồn tại', 404));
    }

    // Only drivers or order owner can update ETA
    if (req.user.id !== order.driverId && req.user.id !== order.userId && req.user.role !== 'admin') {
      return next(new AppError('Không có quyền cập nhật ETA cho đơn hàng này', 403));
    }

    // Parse delivery address to get coordinates
    const deliveryCoords = await geocodeAddress(order.deliveryAddress);
    if (!deliveryCoords) {
      return next(new AppError('Không thể xác định tọa độ địa chỉ giao hàng', 400));
    }

    // Get real-time duration from Google Maps
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return next(new AppError('Google Maps API key not configured', 500));
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${currentLocation.lat},${currentLocation.lng}`,
        destinations: `${deliveryCoords.lat},${deliveryCoords.lng}`,
        key: apiKey,
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        language: 'vi'
      }
    });

    if (response.data.status !== 'OK' || 
        !response.data.rows[0] || 
        response.data.rows[0].elements[0].status !== 'OK') {
      return next(new AppError('Không thể tính toán ETA với traffic', 400));
    }

    const element = response.data.rows[0].elements[0];
    const durationInTraffic = element.duration_in_traffic || element.duration;
    const newETA = new Date(Date.now() + durationInTraffic.value * 1000);

    // Update order
    order.estimatedDeliveryTime = newETA;
    await order.save();

    // Emit socket event to notify customer
    const { emitToUser } = require('../socket/handlers');
    emitToUser(order.userId, 'eta_updated', {
      orderId: order.id,
      estimatedDeliveryTime: newETA.toISOString(),
      durationMinutes: Math.ceil(durationInTraffic.value / 60)
    });

    res.status(200).json({
      status: 'success',
      data: {
        orderId: order.id,
        estimatedDeliveryTime: newETA.toISOString(),
        durationMinutes: Math.ceil(durationInTraffic.value / 60),
        distance: element.distance.text
      }
    });
  } catch (error) {
    console.error('Update ETA with traffic error:', error);
    return next(new AppError('Lỗi khi cập nhật ETA với thông tin traffic', 500));
  }
});

// Helper functions
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(point2.lat - point1.lat);
  const dLon = deg2rad(point2.lng - point1.lng);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(point1.lat)) * Math.cos(deg2rad(point2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getZoneColor(index) {
  const colors = ['#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#3F51B5'];
  return colors[index % colors.length];
}

async function geocodeAddress(address) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey,
        language: 'vi',
        region: 'VN'
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}