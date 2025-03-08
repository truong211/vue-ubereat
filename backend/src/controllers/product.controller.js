const { validationResult } = require('express-validator');
const { Product, Category, Restaurant, Review, User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

/**
 * Get all products
 * @route GET /api/products
 * @access Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'name',
      order = 'asc',
      search = '',
      categoryId,
      restaurantId,
      minPrice,
      maxPrice,
      isVegetarian,
      isVegan,
      isGlutenFree,
      status = 'available'
    } = req.query;

    // Build filter object
    const filter = {
      status: status === 'all' ? { [Op.ne]: null } : status
    };

    // Add search filter if provided
    if (search) {
      filter.name = { [Op.like]: `%${search}%` };
    }

    // Add category filter if provided
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Add restaurant filter if provided
    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    // Add price range filter
    if (minPrice) {
      filter.price = { ...filter.price, [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice) {
      filter.price = { ...filter.price, [Op.lte]: parseFloat(maxPrice) };
    }

    // Add dietary filters
    if (isVegetarian === 'true') {
      filter.isVegetarian = true;
    }
    if (isVegan === 'true') {
      filter.isVegan = true;
    }
    if (isGlutenFree === 'true') {
      filter.isGlutenFree = true;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get products
    const products = await Product.findAndCountAll({
      where: filter,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo']
        }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      status: 'success',
      results: products.count,
      totalPages: Math.ceil(products.count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        products: products.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo', 'address']
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
 * Create product
 * @route POST /api/products
 * @access Private (Restaurant Owner)
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      categoryId,
      restaurantId,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spicyLevel,
      preparationTime,
      status,
      isPopular,
      isRecommended,
      nutritionalInfo,
      ingredients,
      allergens
    } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Check if user is the restaurant owner
    if (restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to create products for this restaurant', 403));
    }

    // Check if category exists and belongs to the restaurant
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return next(new AppError('Category not found', 404));
      }
      if (category.restaurantId !== parseInt(restaurantId)) {
        return next(new AppError('Category does not belong to this restaurant', 400));
      }
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      categoryId,
      restaurantId,
      isVegetarian: isVegetarian === 'true' || isVegetarian === true,
      isVegan: isVegan === 'true' || isVegan === true,
      isGlutenFree: isGlutenFree === 'true' || isGlutenFree === true,
      spicyLevel: spicyLevel || 0,
      preparationTime,
      status: status || 'available',
      isPopular: isPopular === 'true' || isPopular === true,
      isRecommended: isRecommended === 'true' || isRecommended === true,
      nutritionalInfo: nutritionalInfo ? JSON.parse(nutritionalInfo) : null,
      ingredients,
      allergens,
      image: req.file ? req.file.filename : null
    });

    res.status(201).json({
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
 * Update product
 * @route PATCH /api/products/:id
 * @access Private (Restaurant Owner)
 */
exports.updateProduct = async (req, res, next) => {
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
      price,
      discountPrice,
      categoryId,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spicyLevel,
      preparationTime,
      status,
      isPopular,
      isRecommended,
      nutritionalInfo,
      ingredients,
      allergens
    } = req.body;

    // Find product
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Check if user is the restaurant owner
    if (product.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this product', 403));
    }

    // Check if category exists and belongs to the restaurant
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return next(new AppError('Category not found', 404));
      }
      if (category.restaurantId !== product.restaurantId) {
        return next(new AppError('Category does not belong to this restaurant', 400));
      }
    }

    // Update product
    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
    product.categoryId = categoryId || product.categoryId;
    product.isVegetarian = isVegetarian !== undefined ? (isVegetarian === 'true' || isVegetarian === true) : product.isVegetarian;
    product.isVegan = isVegan !== undefined ? (isVegan === 'true' || isVegan === true) : product.isVegan;
    product.isGlutenFree = isGlutenFree !== undefined ? (isGlutenFree === 'true' || isGlutenFree === true) : product.isGlutenFree;
    product.spicyLevel = spicyLevel !== undefined ? spicyLevel : product.spicyLevel;
    product.preparationTime = preparationTime !== undefined ? preparationTime : product.preparationTime;
    product.status = status || product.status;
    product.isPopular = isPopular !== undefined ? (isPopular === 'true' || isPopular === true) : product.isPopular;
    product.isRecommended = isRecommended !== undefined ? (isRecommended === 'true' || isRecommended === true) : product.isRecommended;
    product.nutritionalInfo = nutritionalInfo ? JSON.parse(nutritionalInfo) : product.nutritionalInfo;
    product.ingredients = ingredients !== undefined ? ingredients : product.ingredients;
    product.allergens = allergens !== undefined ? allergens : product.allergens;

    // Update image if provided
    if (req.file) {
      product.image = req.file.filename;
    }

    await product.save();

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
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private (Restaurant Owner)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Check if user is the restaurant owner
    if (product.restaurant.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this product', 403));
    }

    // Delete product
    await product.destroy();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product reviews
 * @route GET /api/products/:id/reviews
 * @access Public
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews
    const reviews = await Review.findAndCountAll({
      where: { productId: id, isVisible: true },
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