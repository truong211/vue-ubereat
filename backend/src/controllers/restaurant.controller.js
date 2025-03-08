const { validationResult } = require('express-validator');
const { Restaurant, Category, Product, Review, User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

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
      minRating = 0,
      maxDeliveryFee = 1000,
      isActive = true
    } = req.query;

    // Build filter object
    const filter = {
      isActive: isActive === 'true' || isActive === true
    };

    // Add search filter if provided
    if (search) {
      filter.name = { [Op.like]: `%${search}%` };
    }

    // Add cuisine filter if provided
    if (cuisine) {
      filter.cuisineType = cuisine;
    }

    // Add rating filter
    if (minRating) {
      filter.rating = { [Op.gte]: parseFloat(minRating) };
    }

    // Add delivery fee filter
    if (maxDeliveryFee) {
      filter.deliveryFee = { [Op.lte]: parseFloat(maxDeliveryFee) };
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get restaurants
    const restaurants = await Restaurant.findAndCountAll({
      where: filter,
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: restaurants.count,
      totalPages: Math.ceil(restaurants.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        restaurants: restaurants.rows
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