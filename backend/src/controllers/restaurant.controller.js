const { validationResult } = require('express-validator');
const { Restaurant, Category, Product, Review, User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { format } = require('date-fns');

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
          attributes: ['id', 'name', 'description', 'displayOrder'],
          include: [
            {
              model: Product,
              as: 'products',
              where: { status: 'available' },
              required: false,
              attributes: [
                'id', 'name', 'description', 'price', 'image', 
                'preparationTime', 'isSpicy', 'isVegetarian',
                'isVegan', 'isGlutenFree', 'spicyLevel',
                'isPopular', 'isRecommended', 'allergens', 
                'ingredients', 'nutritionalInfo'
              ]
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
          where: { isVisible: true },
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'rating', 'comment', 'createdAt', 'images']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT AVG(rating)
              FROM reviews
              WHERE restaurantId = Restaurant.id
              AND isVisible = true
            )`),
            'averageRating'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM reviews
              WHERE restaurantId = Restaurant.id
              AND isVisible = true
            )`),
            'totalReviews'
          ]
        ]
      }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Calculate distance if coordinates provided
    let result = restaurant.toJSON();
    if (latitude && longitude && restaurant.latitude && restaurant.longitude) {
      result.distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(restaurant.latitude),
        parseFloat(restaurant.longitude)
      );
    }

    // Calculate current open status
    const currentTime = new Date();
    const dayOfWeek = format(currentTime, 'EEEE').toLowerCase();
    const currentHours = result.openingHours?.[dayOfWeek];
    
    result.isCurrentlyOpen = false;
    if (currentHours?.enabled) {
      const now = format(currentTime, 'HH:mm');
      result.isCurrentlyOpen = now >= currentHours.open && now <= currentHours.close;
    }

    // Check for temporary closure
    if (result.tempClosureSettings?.isTemporarilyClosed) {
      result.isCurrentlyOpen = false;
      result.closureReason = result.tempClosureSettings.showReason 
        ? result.tempClosureSettings.closureReason 
        : 'Temporarily closed';
      result.reopenDate = result.tempClosureSettings.reopenDate;
    }

    // Get three most recent reviews
    const recentReviews = await Review.findAll({
      where: { restaurantId: id, isVisible: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 3
    });
    
    result.recentReviews = recentReviews;

    // Get restaurant settings if exists
    const settings = await db.RestaurantSettings.findOne({
      where: { restaurantId: id }
    });
    
    if (settings) {
      result.settings = settings;
      // Reflect current availability from settings
      if (settings.isOpen !== undefined) {
        result.isCurrentlyOpen = settings.isOpen && result.isCurrentlyOpen;
      }
      
      // Add estimated preparation time from settings if available
      if (settings.estimatedPrepTime) {
        result.currentEstimatedPrepTime = settings.estimatedPrepTime;
      }
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

/**
 * Search restaurants with filters
 * @route GET /api/restaurants/search
 * @access Public
 */
exports.searchRestaurants = async (req, res, next) => {
  try {
    const {
      search = '',
      cuisines = '',
      sort = 'rating',
      minRating = 0,
      priceRange = '',
      maxDeliveryTime = null,
      maxDistance = null,
      freeDelivery = false,
      openNow = false,
      page = 1,
      limit = 12,
      latitude = null,
      longitude = null
    } = req.query;

    // Build filter object
    const filter = {
      isActive: true
    };

    // Text search
    if (search) {
      filter[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { '$categories.name$': { [Op.like]: `%${search}%` } },
        { '$menuItems.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Cuisine filter
    if (cuisines) {
      const cuisineList = cuisines.split(',');
      filter['$categories.name$'] = { [Op.in]: cuisineList };
    }

    // Rating filter
    if (minRating > 0) {
      filter.rating = { [Op.gte]: parseFloat(minRating) };
    }

    // Price range filter
    if (priceRange) {
      const ranges = priceRange.split(',').map(Number);
      filter.priceLevel = { [Op.in]: ranges };
    }

    // Delivery fee filter
    if (freeDelivery === 'true') {
      filter.deliveryFee = 0;
    }

    // Delivery time filter
    if (maxDeliveryTime) {
      filter.estimatedDeliveryTime = { [Op.lte]: parseInt(maxDeliveryTime) };
    }

    // Open now filter
    if (openNow === 'true') {
      // TODO: Implement proper opening hours logic
      filter.isOpen = true;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get restaurants with includes
    const { rows: restaurants, count: totalCount } = await Restaurant.findAndCountAll({
      where: filter,
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        },
        {
          model: MenuItem,
          as: 'menuItems',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      distinct: true,
      limit: parseInt(limit),
      offset
    });

    // If location provided, calculate distances and filter by max distance
    let results = restaurants;
    if (latitude && longitude) {
      results = restaurants
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
        .filter(rest => !maxDistance || (rest.distance && rest.distance <= parseFloat(maxDistance)));
    }

    // Apply sorting
    const sortField = {
      rating: 'rating',
      price_asc: 'priceLevel',
      price_desc: 'priceLevel',
      distance: 'distance',
      name: 'name'
    }[sort] || 'rating';

    const sortOrder = ['price_desc', 'rating'].includes(sort) ? 'DESC' : 'ASC';
    
    results.sort((a, b) => {
      if (sort === 'distance') {
        return (a.distance || 999) - (b.distance || 999);
      }
      
      if (sortOrder === 'DESC') {
        return b[sortField] - a[sortField];
      }
      return a[sortField] - b[sortField];
    });

    res.json({
      status: 'success',
      data: {
        restaurants: results,
        totalCount: maxDistance ? results.length : totalCount,
        page: parseInt(page),
        totalPages: Math.ceil((maxDistance ? results.length : totalCount) / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant search suggestions
 * @route GET /api/restaurants/suggestions
 * @access Public
 */
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const restaurants = await Restaurant.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%{query}%` } },
          { cuisineType: { [Op.like]: `%{query}%` } }
        ],
        isActive: true
      },
      attributes: ['name', 'cuisineType'],
      limit: 10
    });

    // Extract unique suggestions from restaurant names and cuisine types
    const suggestions = [...new Set([
      ...restaurants.map(r => r.name),
      ...restaurants.map(r => r.cuisineType)
    ])].filter(Boolean);

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions
 * @route GET /api/restaurants/suggestions
 * @access Public
 */
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        restaurants: [],
        cuisines: [],
        dishes: []
      });
    }

    // Get restaurant suggestions
    const restaurants = await Restaurant.findAll({
      where: {
        name: { [Op.like]: `%${query}%` },
        isActive: true
      },
      limit: 5,
      attributes: ['id', 'name', 'image']
    });

    // Get cuisine suggestions
    const cuisines = await Category.findAll({
      where: {
        name: { [Op.like]: `%${query}%` }
      },
      limit: 5,
      attributes: ['id', 'name']
    });

    // Get dish suggestions
    const dishes = await MenuItem.findAll({
      where: {
        name: { [Op.like]: `%${query}%` },
        isAvailable: true
      },
      limit: 5,
      attributes: ['id', 'name', 'restaurantId'],
      include: [{
        model: Restaurant,
        attributes: ['name'],
        where: { isActive: true }
      }]
    });

    res.json({
      restaurants: restaurants.map(r => r.toJSON()),
      cuisines: cuisines.map(c => c.toJSON()),
      dishes: dishes.map(d => ({
        ...d.toJSON(),
        restaurantName: d.Restaurant.name
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all cuisine types
 * @route GET /api/restaurants/cuisines
 * @access Public
 */
exports.getCuisineTypes = async (req, res, next) => {
  try {
    const cuisines = await Restaurant.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('cuisineType')), 'cuisine']],
      where: { isActive: true }
    });

    res.json({
      status: 'success',
      data: cuisines.map(c => c.get('cuisine')).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular cuisine types
 * @route GET /api/restaurants/cuisines
 * @access Public
 */
exports.getCuisineTypes = async (req, res, next) => {
  try {
    const cuisines = await Category.findAll({
      attributes: ['id', 'name'],
      include: [{
        model: Restaurant,
        attributes: [],
        through: { attributes: [] }
      }],
      group: ['Category.id'],
      having: sequelize.literal('COUNT(Restaurants.id) > 0')
    });

    res.json({
      status: 'success',
      data: cuisines
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update restaurant settings
 * @route PATCH /api/restaurants/:id/settings
 * @access Private (Restaurant Owner)
 */
exports.updateRestaurantSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { openingHours, deliverySettings, notificationPreferences } = req.body;

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Update settings
    const updates = {};
    if (openingHours) updates.openingHours = openingHours;
    if (deliverySettings) updates.deliverySettings = deliverySettings;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

    await restaurant.update(updates);

    // If auto-accept setting changed, update socket subscription
    if (deliverySettings?.autoAccept !== undefined) {
      const socket = req.app.get('socketio');
      const room = `restaurant:${restaurant.id}`;
      
      if (deliverySettings.autoAccept) {
        socket.to(room).emit('auto_accept_enabled');
      } else {
        socket.to(room).emit('auto_accept_disabled');
      }
    }

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
 * Get restaurant availability
 * @route GET /api/restaurants/:id/availability
 * @access Public
 */
exports.getRestaurantAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Get day of week for requested date
    const requestedDate = date ? new Date(date) : new Date();
    const dayOfWeek = format(requestedDate, 'EEEE');

    // Check if it's a special holiday
    const specialHolidays = restaurant.specialHolidays || [];
    const holiday = specialHolidays.find(h => 
      format(new Date(h.date), 'yyyy-MM-dd') === format(requestedDate, 'yyyy-MM-dd')
    );

    if (holiday) {
      return res.status(200).json({
        status: 'success',
        data: {
          isOpen: holiday.isOpen,
          openTime: holiday.isOpen ? holiday.openTime : null,
          closeTime: holiday.isOpen ? holiday.closeTime : null,
          isHoliday: true
        }
      });
    }

    // Get regular opening hours for the day
    const hours = restaurant.openingHours[dayOfWeek];

    res.status(200).json({
      status: 'success',
      data: {
        isOpen: hours.enabled,
        openTime: hours.enabled ? hours.open : null,
        closeTime: hours.enabled ? hours.close : null,
        isHoliday: false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update special holidays
 * @route PATCH /api/restaurants/:id/holidays
 * @access Private (Restaurant Owner)
 */
exports.updateSpecialHolidays = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialHolidays } = req.body;

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    await restaurant.update({ specialHolidays });

    res.status(200).json({
      status: 'success',
      data: {
        specialHolidays
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateRestaurantAvailability = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { 
      isOpen, 
      availabilityStatus, 
      busyLevel, 
      estimatedPrepTime,
      statusMessage,
      acceptingOrders 
    } = req.body;

    // Find restaurant first to validate it exists
    const restaurant = await db.Restaurant.findByPk(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Find or create restaurant settings
    let settings = await db.RestaurantSettings.findOne({
      where: { restaurantId }
    });

    if (!settings) {
      settings = await db.RestaurantSettings.create({ restaurantId });
    }

    // Update settings
    const updatedSettings = await settings.update({
      isOpen: isOpen !== undefined ? isOpen : settings.isOpen,
      availabilityStatus: availabilityStatus || settings.availabilityStatus,
      busyLevel: busyLevel !== undefined ? busyLevel : settings.busyLevel,
      estimatedPrepTime: estimatedPrepTime !== undefined ? estimatedPrepTime : settings.estimatedPrepTime,
      statusMessage: statusMessage !== undefined ? statusMessage : settings.statusMessage,
      acceptingOrders: acceptingOrders !== undefined ? acceptingOrders : settings.acceptingOrders,
    });

    // Emit real-time update via socket
    if (req.io) {
      req.io.emit('restaurant_availability_updated', {
        restaurantId,
        status: updatedSettings.availabilityStatus,
        isOpen: updatedSettings.isOpen,
        busyLevel: updatedSettings.busyLevel,
        estimatedPrepTime: updatedSettings.estimatedPrepTime,
        message: updatedSettings.statusMessage,
        acceptingOrders: updatedSettings.acceptingOrders,
        updatedAt: updatedSettings.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

const getRestaurantSettings = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    const settings = await db.RestaurantSettings.findOne({
      where: { restaurantId }
    });

    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          restaurantId: parseInt(restaurantId),
          isOpen: true,
          availabilityStatus: 'online',
          acceptingOrders: true
        }
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update menu availability settings
 * @route PATCH /api/restaurants/:id/menu-availability
 * @access Private (Restaurant Owner)
 */
exports.updateMenuAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { menuAvailability } = req.body;

    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    await restaurant.update({ menuAvailability });

    // Emit socket event to notify clients of menu changes
    const io = req.app.get('socketio');
    io.to(`restaurant:${id}`).emit('menu_availability_updated', {
      restaurantId: id,
      menuAvailability
    });

    res.status(200).json({
      status: 'success',
      data: { menuAvailability }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update temporary closure settings
 * @route PATCH /api/restaurants/:id/temp-closure
 * @access Private (Restaurant Owner)
 */
exports.updateTempClosure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tempClosureSettings } = req.body;

    const restaurant = await Restaurant.findOne({
      where: { id, userId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    await restaurant.update({ tempClosureSettings });

    // Emit socket event to notify clients of closure status
    const io = req.app.get('socketio');
    io.to(`restaurant:${id}`).emit('restaurant_closure_updated', {
      restaurantId: id,
      tempClosureSettings
    });

    // If restaurant is temporarily closed, handle existing orders
    if (tempClosureSettings.isTemporarilyClosed) {
      await handleExistingOrdersOnClosure(id, tempClosureSettings);
    }

    res.status(200).json({
      status: 'success',
      data: { tempClosureSettings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle existing orders when restaurant goes into temporary closure
 * @private
 */
const handleExistingOrdersOnClosure = async (restaurantId, closureSettings) => {
  const { Order } = require('../models');
  const pendingOrders = await Order.findAll({
    where: {
      restaurantId,
      status: {
        [Op.in]: ['pending', 'confirmed']
      }
    }
  });

  for (const order of pendingOrders) {
    if (!closureSettings.acceptPreOrders) {
      await order.update({
        status: 'cancelled',
        cancellationReason: 'Restaurant temporarily closed'
      });

      // Notify customer about cancellation
      const io = global.io;
      io.to(`user:${order.userId}`).emit('order_cancelled', {
        orderId: order.id,
        reason: 'Restaurant temporarily closed'
      });
    }
  }
};

module.exports = {
  // ...existing exports...
  updateRestaurantAvailability,
  getRestaurantSettings,
  updateMenuAvailability,
  updateTempClosure
};

/**
 * Get product details
 * @route GET /api/restaurants/:restaurantId/products/:productId
 * @access Public
 */
exports.getProductDetails = async (req, res, next) => {
  try {
    const { restaurantId, productId } = req.params;

    const product = await Product.findOne({
      where: {
        id: productId,
        restaurantId: restaurantId
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ProductOption,
          as: 'options',
          attributes: ['id', 'name', 'type'],
          include: [
            {
              model: ProductOptionChoice,
              as: 'choices',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ],
      attributes: [
        'id', 'name', 'description', 'price', 'image',
        'preparationTime', 'isSpicy', 'isVegetarian',
        'allergens', 'nutritionInfo', 'status'
      ]
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
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
    const { 
      page = 1, 
      limit = 10,
      rating = null,
      sort = 'recent' // recent, rating-high, rating-low
    } = req.query;

    const where = { 
      restaurantId: id,
      isVisible: true
    };

    if (rating) {
      where.rating = parseFloat(rating);
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    let order = [['createdAt', 'DESC']];
    if (sort === 'rating-high') {
      order = [['rating', 'DESC'], ['createdAt', 'DESC']];
    } else if (sort === 'rating-low') {
      order = [['rating', 'ASC'], ['createdAt', 'DESC']];
    }

    const reviews = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'profileImage']
        },
        {
          model: OrderItem,
          as: 'orderedItems',
          attributes: ['id', 'productName'],
          through: { attributes: [] }
        }
      ],
      order,
      limit: parseInt(limit),
      offset,
      attributes: [
        'id', 'rating', 'comment', 'createdAt', 
        'images', 'likes', 'response'
      ]
    });

    // Get rating statistics
    const ratingStats = await Review.findAll({
      where: { restaurantId: id, isVisible: true },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
      ],
      group: ['rating']
    });

    res.status(200).json({
      status: 'success',
      results: reviews.count,
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        reviews: reviews.rows,
        ratingStats: ratingStats.reduce((acc, stat) => {
          acc[stat.rating] = parseInt(stat.get('count'));
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update restaurant password
 * @route PATCH /api/restaurants/:id/password
 * @access Private (Restaurant Owner)
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findOne({
      where: {
        id,
        userId: req.user.id
      },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'password']
      }]
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or you are not authorized', 404));
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, restaurant.owner.password);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: restaurant.userId } }
    );

    // Log password change
    await ActivityLog.create({
      userId: req.user.id,
      action: 'password_change',
      details: 'Password changed successfully',
      ipAddress: req.ip
    });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};