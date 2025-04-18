const { validationResult } = require('express-validator');
const Restaurant = require('../models/restaurant.model');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/database');
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

    // Build basic filter object
    const filter = { isActive: true };

    // Due to the simplification of our model, advanced filtering needs to be handled manually
    // These filters will be applied after we get results from the database

    // Get restaurants with basic filtering and pagination
    try {
      // Get all restaurants - we'll filter manually since our model doesn't have the same
      // advanced filtering capabilities as Sequelize
      const allRestaurants = await Restaurant.findAll({ 
        where: filter, 
        order: `${sort} ${order}` 
      });

      // Apply filters manually
      let filteredRestaurants = allRestaurants;
      
      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        filteredRestaurants = filteredRestaurants.filter(r => 
          (r.name && r.name.toLowerCase().includes(searchLower)) ||
          (r.description && r.description.toLowerCase().includes(searchLower)) ||
          (r.cuisineType && r.cuisineType.toLowerCase().includes(searchLower)) ||
          (r.address && r.address.toLowerCase().includes(searchLower))
        );
      }

      // Apply cuisine filter if provided
      if (cuisine && cuisine !== 'null' && cuisine !== 'all') {
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.cuisineType && r.cuisineType.toLowerCase() === cuisine.toLowerCase()
        );
      }

      // Apply rating filter
      if (minRating && minRating !== 'null') {
        const minRatingValue = parseFloat(minRating);
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.rating && r.rating >= minRatingValue
        );
      }

      // Apply delivery fee filter
      if (maxDeliveryFee && maxDeliveryFee !== 'null') {
        const maxFeeValue = parseFloat(maxDeliveryFee);
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.deliveryFee && r.deliveryFee <= maxFeeValue
        );
      }

      // Apply delivery time filter
      if (maxDeliveryTime && maxDeliveryTime !== 'null') {
        const maxTimeValue = parseInt(maxDeliveryTime);
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.estimatedDeliveryTime && r.estimatedDeliveryTime <= maxTimeValue
        );
      }

      // Apply price range filter
      if (priceRange && priceRange !== 'null') {
        // If priceRange is a comma-separated range like "10000,50000"
        if (priceRange.includes(',')) {
          const [min, max] = priceRange.split(',').map(Number);
          filteredRestaurants = filteredRestaurants.filter(r => 
            r.priceRange && r.priceRange >= min && r.priceRange <= max
          );
        } else {
          filteredRestaurants = filteredRestaurants.filter(r => 
            r.priceRange && r.priceRange === parseInt(priceRange)
          );
        }
      }

      // Calculate distance if coordinates are provided
      if (latitude && longitude) {
        filteredRestaurants = filteredRestaurants.map(restaurant => {
          const rest = { ...restaurant };
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
          const maxDistValue = parseFloat(maxDistance);
          filteredRestaurants = filteredRestaurants.filter(r => 
            r.distance !== null && r.distance <= maxDistValue
          );
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
      }

      // Get total count of filtered restaurants before pagination
      const totalCount = filteredRestaurants.length;

      // Apply pagination manually
      const offset = (parseInt(page) - 1) * parseInt(limit);
      filteredRestaurants = filteredRestaurants.slice(offset, offset + parseInt(limit));

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
      console.error('Error fetching restaurants:', error);
      throw new AppError('Error fetching restaurants', 500);
    }
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

    try {
      // Get all active restaurants
      const restaurants = await Restaurant.findAll({
        where: { isActive: true }
      });

      // Calculate distance and filter
      const nearbyRestaurants = restaurants
        .map(restaurant => {
          const rest = { ...restaurant };
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
      console.error('Error searching restaurants by location:', error);
      next(new AppError('Error searching restaurants by location', 500));
    }
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

    // Get restaurant by ID using direct SQL
    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Calculate distance if coordinates provided
    if (latitude && longitude && restaurant.latitude && restaurant.longitude) {
      restaurant.distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(restaurant.latitude),
        parseFloat(restaurant.longitude)
      );
    }

    // Get restaurant categories
    try {
      const categories = await db.query(`
        SELECT c.id, c.name, c.description, c.displayOrder 
        FROM categories c
        JOIN restaurant_categories rc ON c.id = rc.category_id
        WHERE rc.restaurant_id = ?
        ORDER BY c.displayOrder
      `, [id]);
      
      // Get products for each category
      for (const category of categories) {
        const products = await db.query(`
          SELECT id, name, description, price, image, preparationTime, 
            isSpicy, isVegetarian, isVegan, isGlutenFree, spicyLevel,
            isPopular, isRecommended, allergens, ingredients, nutritionalInfo
          FROM products
          WHERE category_id = ? AND status = 'available'
          ORDER BY displayOrder
        `, [category.id]);
        
        category.products = products;
      }
      
      // Get reviews
      const reviews = await db.query(`
        SELECT r.id, r.rating, r.comment, r.createdAt, r.images,
          u.id as userId, u.fullName, u.profileImage
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.restaurant_id = ? AND r.isVisible = 1
        ORDER BY r.createdAt DESC
        LIMIT 5
      `, [id]);
      
      // Structure reviews with user info
      const formattedReviews = reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        images: review.images,
        user: {
          id: review.userId,
          fullName: review.fullName,
          profileImage: review.profileImage
        }
      }));
      
      // Return complete restaurant data
    res.status(200).json({
      status: 'success',
      data: {
          restaurant: {
            ...restaurant,
            categories,
            reviews: formattedReviews
          }
        }
      });
    } catch (error) {
      console.error('Error getting restaurant details:', error);
      next(new AppError('Error fetching restaurant details', 500));
    }
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
 * Update restaurant settings
 * @route PATCH /api/restaurants/:id/settings
 * @access Private (Restaurant Owner)
 */
console.log('updateRestaurantSettings method exists in exports:', exports.updateRestaurantSettings !== undefined);
exports.updateRestaurantSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      openingHours, 
      deliverySettings, 
      notificationPreferences,
      specialHolidays,
      tempClosureSettings,
      menuAvailability
    } = req.body;

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

    // Prepare updates
    const updates = {};
    if (openingHours) updates.openingHours = openingHours;
    if (deliverySettings) updates.deliverySettings = deliverySettings;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;
    if (specialHolidays) updates.specialHolidays = specialHolidays;
    if (tempClosureSettings) updates.tempClosureSettings = tempClosureSettings;
    if (menuAvailability) updates.menuAvailability = menuAvailability;

    // Update restaurant
    await restaurant.update(updates);

    // Emit socket events if needed
    const io = req.app.get('socketio');
    if (io) {
      if (deliverySettings) {
        io.to(`restaurant:${id}`).emit('delivery_settings_updated', deliverySettings);
      }
      if (tempClosureSettings) {
        io.to(`restaurant:${id}`).emit('temp_closure_updated', tempClosureSettings);
      }
      if (menuAvailability) {
        io.to(`restaurant:${id}`).emit('menu_availability_updated', menuAvailability);
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
    const restaurants = await db.query(`
      SELECT * FROM restaurants 
      WHERE isActive = 1 AND rating >= 4.0
      ORDER BY rating DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // Calculate distance if user coordinates provided
    let results = restaurants;
    if (latitude && longitude) {
      results = restaurants.map(restaurant => {
        const rest = { ...restaurant };
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
    
    // Get restaurants with highest rating using direct SQL
    // In a real app, we would consider order count
    const restaurants = await db.query(`
      SELECT * FROM restaurants 
      WHERE isActive = 1 
      ORDER BY rating DESC, RAND()
      LIMIT ?
    `, [parseInt(limit)]);

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
    // Get distinct cuisine types from restaurants table using direct SQL
    const cuisines = await db.query(`
      SELECT DISTINCT cuisineType as cuisine 
      FROM restaurants 
      WHERE isActive = 1 AND cuisineType IS NOT NULL
    `);

    // Filter out any null or empty values and return
    res.json({
      status: 'success',
      data: cuisines.map(c => c.cuisine).filter(Boolean)
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

/**
 * Update restaurant availability
 * @route PATCH /api/restaurants/:id/availability
 * @access Private (Restaurant Owner)
 */
exports.updateRestaurantAvailability = async (req, res, next) => {
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

/**
 * Get restaurant settings
 * @route GET /api/restaurants/:id/settings
 * @access Private (Restaurant Owner)
 */
exports.getRestaurantSettings = async (req, res, next) => {
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

/**
 * Get nearby restaurants based on coordinates
 * @route GET /api/restaurants/nearby
 * @access Public
 */
exports.getNearbyRestaurants = async (req, res, next) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 5, 
      limit = 4 
    } = req.query;

    // Validate coordinates - return empty array instead of error if coordinates are missing
    if (!lat || !lng) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          restaurants: []
        }
      });
    }

    try {
      // Get all active restaurants
    const allRestaurants = await Restaurant.findAll({
        where: { isActive: true }
    });

    // Calculate distance for each restaurant and filter by radius
    const nearbyRestaurants = allRestaurants
      .map(restaurant => {
          const rest = { ...restaurant };
        if (restaurant.latitude && restaurant.longitude) {
          rest.distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(restaurant.latitude),
            parseFloat(restaurant.longitude)
          );
        } else {
          rest.distance = null;
        }
        return rest;
      })
      .filter(restaurant => 
        restaurant.distance !== null && restaurant.distance <= parseFloat(radius)
      )
      // Sort by distance (closest first)
      .sort((a, b) => a.distance - b.distance)
      // Limit results
      .slice(0, parseInt(limit));

      // Log successfully finding restaurants
      console.log(`Found ${nearbyRestaurants.length} nearby restaurants within ${radius}km of lat: ${lat}, lng: ${lng}`);

      return res.status(200).json({
      status: 'success',
      results: nearbyRestaurants.length,
      data: {
        restaurants: nearbyRestaurants
      }
    });
    } catch (error) {
      console.error('Error finding nearby restaurants:', error);
      throw new AppError('Error finding nearby restaurants', 500);
    }
  } catch (error) {
    next(error);
  }
};
