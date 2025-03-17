const { validationResult } = require('express-validator');
const { Restaurant, Category, Product, Review, User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - User latitude
 * @param {Number} lon1 - User longitude
 * @param {Number} lat2 - Restaurant latitude
 * @param {Number} lon2 - Restaurant longitude
 * @returns {Number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get all restaurants
 * @route GET /api/restaurants
 * @access Public
 */
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'rating', 
      order = 'desc',
      search = '',
      cuisine = '',
      category_id = '',
      minRating = 0,
      maxDeliveryFee = 1000,
      maxDeliveryTime = null,
      maxDistance = null,
      priceRange = null,
      latitude = null,
      longitude = null,
      isActive = true
    } = req.query;

    // Build filter object
    const filter = {
      isActive: isActive === 'true' || isActive === true
    };

    // Add search filter if provided
    if (search) {
      filter[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { cuisineType: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add cuisine filter if provided
    if (cuisine && cuisine !== 'null' && cuisine !== 'all') {
      filter.cuisineType = cuisine;
    }

    // Add rating filter
    if (minRating && minRating !== 'null') {
      filter.rating = { [Op.gte]: parseFloat(minRating) };
    }

    // Add delivery fee filter
    if (maxDeliveryFee && maxDeliveryFee !== 'null') {
      filter.deliveryFee = { [Op.lte]: parseFloat(maxDeliveryFee) };
    }

    // Add delivery time filter
    if (maxDeliveryTime && maxDeliveryTime !== 'null') {
      filter.estimatedDeliveryTime = { [Op.lte]: parseInt(maxDeliveryTime) };
    }

    // Add price range filter
    if (priceRange && priceRange !== 'null') {
      filter.priceRange = priceRange;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Create include array for associations
    const includeArray = [
      {
        model: Category,
        as: 'categories',
        attributes: ['id', 'name'],
        required: false
      }
    ];

    // If category_id is provided, filter by category
    if (category_id && category_id !== 'null') {
      includeArray[0].where = { id: category_id };
      includeArray[0].required = true;
    }

    // Get restaurants
    let restaurants = await Restaurant.findAndCountAll({
      where: filter,
      include: includeArray,
      order: [[sort, order]],
      limit: parseInt(limit),
      offset
    });

    // If coordinates are provided, calculate distance for each restaurant
    let filteredRestaurants = restaurants.rows;
    let totalCount = restaurants.count;

    if (latitude && longitude) {
      // Add distance to each restaurant
      filteredRestaurants = restaurants.rows.map(restaurant => {
        const rest = restaurant.toJSON();
        if (restaurant.latitude && restaurant.longitude) {
          rest.distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(restaurant.latitude),
            parseFloat(restaurant.longitude)
          );
        } else {
          rest.distance = null;
        }
        return rest;
      });

      // Filter by max distance if provided
      if (maxDistance && maxDistance !== 'null') {
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.distance !== null && r.distance <= parseFloat(maxDistance)
        );
        totalCount = filteredRestaurants.length;
      }

      // Sort by distance if requested
      if (sort === 'distance') {
        filteredRestaurants.sort((a, b) => {
          // Handle null distances (put them at the end)
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          
          // Sort by distance
          return order === 'asc' ? a.distance - b.distance : b.distance - a.distance;
        });
      }

      // Apply pagination manually
      filteredRestaurants = filteredRestaurants.slice(offset, offset + parseInt(limit));
    }

    res.status(200).json({
      status: 'success',
      results: totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        restaurants: filteredRestaurants
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search restaurants by location
 * @route GET /api/restaurants/search
 * @access Public
 */
exports.searchRestaurantsByLocation = async (req, res, next) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 10, // Default 10km radius
      page = 1,
      limit = 10
    } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return next(new AppError('Latitude and longitude are required', 400));
    }

    // Get all restaurants
    const restaurants = await Restaurant.findAll({
      where: { isActive: true },
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    // Calculate distance and filter
    const nearbyRestaurants = restaurants
      .map(restaurant => {
        const rest = restaurant.toJSON();
        if (restaurant.latitude && restaurant.longitude) {
          rest.distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(restaurant.latitude),
            parseFloat(restaurant.longitude)
          );
        } else {
          rest.distance = null;
        }
        return rest;
      })
      .filter(rest => rest.distance !== null && rest.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    // Manual pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedResults = nearbyRestaurants.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: nearbyRestaurants.length,
      totalPages: Math.ceil(nearbyRestaurants.length / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        restaurants: paginatedResults
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant by ID
 * @route GET /api/restaurants/:id
 * @access Public
 */
exports.getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;

    const restaurant = await Restaurant.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'categories',
          include: [
            {
              model: Product,
              as: 'products',
              where: { status: 'available' },
              required: false
            }
          ]
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'profileImage']
            }
          ],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // If user coordinates are provided, calculate distance
    let result = restaurant.toJSON();
    if (latitude && longitude && restaurant.latitude && restaurant.longitude) {
      result.distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(restaurant.latitude),
        parseFloat(restaurant.longitude)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        restaurant: result
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create restaurant
 * @route POST /api/restaurants
 * @access Private (Restaurant Owner)
 */
exports.createRestaurant = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      address,
      phone,
      email,
      cuisineType,
      priceRange,
      openingHours,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime,
      latitude,
      longitude
    } = req.body;

    // Create restaurant
    const restaurant = await Restaurant.create({
      userId: req.user.id,
      name,
      description,
      address,
      phone,
      email,
      cuisineType,
      priceRange,
      openingHours: openingHours ? JSON.parse(openingHours) : null,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime,
      latitude,
      longitude,
      logo: req.files?.logo?.[0]?.filename,
      coverImage: req.files?.coverImage?.[0]?.filename
    });

    // Update user role to restaurant
    await User.update(
      { role: 'restaurant' },
      { where: { id: req.user.id } }
    );

    res.status(201).json({
      status: 'success',
      data: {
        restaurant
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update restaurant
 * @route PATCH /api/restaurants/:id
 * @access Private (Restaurant Owner)
 */
exports.updateRestaurant = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name,
      description,
      address,
      phone,
      email,
      cuisineType,
      priceRange,
      openingHours,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime,
      isActive,
      latitude,
      longitude
    } = req.body;

    // Find restaurant
    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Update restaurant
    restaurant.name = name || restaurant.name;
    restaurant.description = description || restaurant.description;
    restaurant.address = address || restaurant.address;
    restaurant.phone = phone || restaurant.phone;
    restaurant.email = email || restaurant.email;
    restaurant.cuisineType = cuisineType || restaurant.cuisineType;
    restaurant.priceRange = priceRange || restaurant.priceRange;
    restaurant.openingHours = openingHours ? JSON.parse(openingHours) : restaurant.openingHours;
    restaurant.deliveryFee = deliveryFee !== undefined ? deliveryFee : restaurant.deliveryFee;
    restaurant.minOrderAmount = minOrderAmount !== undefined ? minOrderAmount : restaurant.minOrderAmount;
    restaurant.estimatedDeliveryTime = estimatedDeliveryTime || restaurant.estimatedDeliveryTime;
    restaurant.isActive = isActive !== undefined ? isActive : restaurant.isActive;
    restaurant.latitude = latitude || restaurant.latitude;
    restaurant.longitude = longitude || restaurant.longitude;

    // Update images if provided
    if (req.files?.logo?.[0]) {
      restaurant.logo = req.files.logo[0].filename;
    }
    if (req.files?.coverImage?.[0]) {
      restaurant.coverImage = req.files.coverImage[0].filename;
    }

    await restaurant.save();

    res.status(200).json({
      status: 'success',
      data: {
        restaurant
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete restaurant
 * @route DELETE /api/restaurants/:id
 * @access Private (Restaurant Owner or Admin)
 */
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find restaurant
    const restaurant = await Restaurant.findOne({
      where: { 
        id,
        [Op.or]: [
          { userId: req.user.id },
          { '$user.role$': 'admin' }
        ]
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'role']
        }
      ]
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Delete restaurant
    await restaurant.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant menu
 * @route GET /api/restaurants/:id/menu
 * @access Public
 */
exports.getRestaurantMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const categories = await Category.findAll({
      where: { restaurantId: id },
      include: [
        {
          model: Product,
          as: 'products',
          where: { status: 'available' },
          required: false
        }
      ],
      order: [
        ['displayOrder', 'ASC'],
        [{ model: Product, as: 'products' }, 'name', 'ASC']
      ]
    });

    res.status(200).json({
      status: 'success',
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant reviews
 * @route GET /api/restaurants/:id/reviews
 * @access Public
 */
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.findAndCountAll({
      where: { restaurantId: id, isVisible: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        reviews: reviews.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured restaurants
 * @route GET /api/restaurants/featured
 * @access Public
 */
exports.getFeaturedRestaurants = async (req, res, next) => {
  try {
    const { latitude, longitude, limit = 6 } = req.query;
    
    // Get restaurants with highest ratings
    const restaurants = await Restaurant.findAll({
      where: { 
        isActive: true,
        rating: { [Op.gte]: 4.0 } // Featured restaurants have good ratings
      },
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['rating', 'DESC']],
      limit: parseInt(limit)
    });

    // Calculate distance if user coordinates provided
    let results = restaurants;
    if (latitude && longitude) {
      results = restaurants.map(restaurant => {
        const rest = restaurant.toJSON();
        if (restaurant.latitude && restaurant.longitude) {
          rest.distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(restaurant.latitude),
            parseFloat(restaurant.longitude)
          );
        }
        return rest;
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        restaurants: results
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular restaurants
 * @route GET /api/restaurants/popular
 * @access Public
 */
exports.getPopularRestaurants = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    
    // Get restaurants with highest order count (would require a join in a real application)
    // For simplicity, we'll use rating and random order for now
    const restaurants = await Restaurant.findAll({
      where: { isActive: true },
      order: [['rating', 'DESC'], sequelize.literal('RAND()')],
      limit: parseInt(limit)
    });

    res.status(200).json({
      status: 'success',
      data: {
        restaurants
      }
    });
  } catch (error) {
    next(error);
  }
};