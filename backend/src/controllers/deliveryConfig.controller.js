const { DeliveryConfig, DeliveryFeeTier, Restaurant } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all delivery configurations
 * @route GET /api/delivery-configs
 * @access Admin
 */
exports.getAllDeliveryConfigs = asyncHandler(async (req, res) => {
  const deliveryConfigs = await DeliveryConfig.findAll({
    include: [
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name']
      },
      {
        model: DeliveryFeeTier,
        as: 'feeTiers',
        order: [['minDistance', 'ASC']]
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: deliveryConfigs
  });
});

/**
 * Get global delivery configuration
 * @route GET /api/delivery-configs/global
 * @access Public
 */
exports.getGlobalDeliveryConfig = asyncHandler(async (req, res) => {
  const globalConfig = await DeliveryConfig.findOne({
    where: { restaurantId: null, isActive: true },
    include: [
      {
        model: DeliveryFeeTier,
        as: 'feeTiers',
        order: [['minDistance', 'ASC']]
      }
    ]
  });
  
  if (!globalConfig) {
    // If no global config exists, create default one
    const defaultConfig = await DeliveryConfig.create({
      restaurantId: null,
      maxDeliveryDistance: 10.00,
      minOrderAmountForDelivery: 50000.00,
      baseDeliveryFee: 15000.00,
      useDistanceBasedFee: true,
      feePerKilometer: 5000.00,
      isActive: true
    });
    
    // Create default fee tiers
    await DeliveryFeeTier.bulkCreate([
      {
        deliveryConfigId: defaultConfig.id,
        minDistance: 0,
        maxDistance: 2,
        fee: 15000.00,
        displayOrder: 1
      },
      {
        deliveryConfigId: defaultConfig.id,
        minDistance: 2.01,
        maxDistance: 5,
        fee: 25000.00,
        displayOrder: 2
      },
      {
        deliveryConfigId: defaultConfig.id,
        minDistance: 5.01,
        maxDistance: 10,
        fee: 35000.00,
        displayOrder: 3
      }
    ]);
    
    // Fetch the created config with tiers
    const createdConfig = await DeliveryConfig.findByPk(defaultConfig.id, {
      include: [
        {
          model: DeliveryFeeTier,
          as: 'feeTiers',
          order: [['minDistance', 'ASC']]
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: createdConfig
    });
  }
  
  res.status(200).json({
    success: true,
    data: globalConfig
  });
});

/**
 * Get delivery configuration by restaurant id
 * @route GET /api/delivery-configs/restaurant/:restaurantId
 * @access Public
 */
exports.getDeliveryConfigByRestaurantId = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  
  // Check if restaurant exists
  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    throw new ApiError(404, 'Restaurant not found');
  }
  
  // Find restaurant-specific config
  const restaurantConfig = await DeliveryConfig.findOne({
    where: { restaurantId, isActive: true },
    include: [
      {
        model: DeliveryFeeTier,
        as: 'feeTiers',
        order: [['minDistance', 'ASC']]
      }
    ]
  });
  
  // If no restaurant-specific config, get global config
  if (!restaurantConfig) {
    const globalConfig = await DeliveryConfig.findOne({
      where: { restaurantId: null, isActive: true },
      include: [
        {
          model: DeliveryFeeTier,
          as: 'feeTiers',
          order: [['minDistance', 'ASC']]
        }
      ]
    });
    
    if (!globalConfig) {
      throw new ApiError(404, 'No delivery configuration found');
    }
    
    // Return global config but mark it as global
    return res.status(200).json({
      success: true,
      data: {
        ...globalConfig.toJSON(),
        isGlobalConfig: true
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: restaurantConfig
  });
});

/**
 * Create delivery configuration
 * @route POST /api/delivery-configs
 * @access Admin, Restaurant Owner
 */
exports.createDeliveryConfig = asyncHandler(async (req, res) => {
  const { restaurantId, feeTiers, ...configData } = req.body;
  
  // If restaurantId is provided, check if restaurant exists
  if (restaurantId) {
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }
    
    // Check if config already exists for this restaurant
    const existingConfig = await DeliveryConfig.findOne({ where: { restaurantId } });
    if (existingConfig) {
      throw new ApiError(400, 'Delivery configuration for this restaurant already exists');
    }
  } else {
    // Check if global config already exists
    const existingGlobalConfig = await DeliveryConfig.findOne({ where: { restaurantId: null } });
    if (existingGlobalConfig) {
      throw new ApiError(400, 'Global delivery configuration already exists');
    }
  }
  
  // Create the delivery config
  const deliveryConfig = await DeliveryConfig.create({
    ...configData,
    restaurantId
  });
  
  // Create fee tiers if provided
  if (feeTiers && Array.isArray(feeTiers) && feeTiers.length > 0) {
    const tiersWithConfigId = feeTiers.map(tier => ({
      ...tier,
      deliveryConfigId: deliveryConfig.id
    }));
    
    await DeliveryFeeTier.bulkCreate(tiersWithConfigId);
  }
  
  // Fetch the created config with tiers
  const createdConfig = await DeliveryConfig.findByPk(deliveryConfig.id, {
    include: [
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name']
      },
      {
        model: DeliveryFeeTier,
        as: 'feeTiers',
        order: [['minDistance', 'ASC']]
      }
    ]
  });
  
  res.status(201).json({
    success: true,
    data: createdConfig
  });
});

/**
 * Update delivery configuration
 * @route PUT /api/delivery-configs/:id
 * @access Admin, Restaurant Owner (own restaurant only)
 */
exports.updateDeliveryConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { feeTiers, ...configData } = req.body;
  
  const deliveryConfig = await DeliveryConfig.findByPk(id);
  if (!deliveryConfig) {
    throw new ApiError(404, 'Delivery configuration not found');
  }
  
  // Update the config
  await deliveryConfig.update(configData);
  
  // Update fee tiers if provided
  if (feeTiers && Array.isArray(feeTiers)) {
    // Delete existing tiers
    await DeliveryFeeTier.destroy({ where: { deliveryConfigId: id } });
    
    // Create new tiers
    if (feeTiers.length > 0) {
      const tiersWithConfigId = feeTiers.map(tier => ({
        ...tier,
        deliveryConfigId: id
      }));
      
      await DeliveryFeeTier.bulkCreate(tiersWithConfigId);
    }
  }
  
  // Fetch the updated config with tiers
  const updatedConfig = await DeliveryConfig.findByPk(id, {
    include: [
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name']
      },
      {
        model: DeliveryFeeTier,
        as: 'feeTiers',
        order: [['minDistance', 'ASC']]
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: updatedConfig
  });
});

/**
 * Delete delivery configuration
 * @route DELETE /api/delivery-configs/:id
 * @access Admin
 */
exports.deleteDeliveryConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deliveryConfig = await DeliveryConfig.findByPk(id);
  if (!deliveryConfig) {
    throw new ApiError(404, 'Delivery configuration not found');
  }
  
  // Check if this is a global config
  if (!deliveryConfig.restaurantId) {
    throw new ApiError(400, 'Cannot delete global delivery configuration');
  }
  
  // Delete associated fee tiers
  await DeliveryFeeTier.destroy({ where: { deliveryConfigId: id } });
  
  // Delete the config
  await deliveryConfig.destroy();
  
  res.status(200).json({
    success: true,
    message: 'Delivery configuration deleted successfully'
  });
});

/**
 * Calculate delivery fee for a specific order
 * @route POST /api/delivery-configs/calculate-fee
 * @access Public
 */
exports.calculateDeliveryFee = asyncHandler(async (req, res) => {
  const { restaurantId, distance, orderAmount } = req.body;
  
  if (!distance || distance <= 0) {
    throw new ApiError(400, 'Valid distance is required');
  }
  
  if (!orderAmount || orderAmount < 0) {
    throw new ApiError(400, 'Valid order amount is required');
  }
  
  // Find the appropriate config (restaurant-specific or global)
  let deliveryConfig;
  
  if (restaurantId) {
    deliveryConfig = await DeliveryConfig.findOne({
      where: { restaurantId, isActive: true },
      include: [
        {
          model: DeliveryFeeTier,
          as: 'feeTiers',
          order: [['minDistance', 'ASC']]
        }
      ]
    });
  }
  
  // If no restaurant-specific config, use global config
  if (!deliveryConfig) {
    deliveryConfig = await DeliveryConfig.findOne({
      where: { restaurantId: null, isActive: true },
      include: [
        {
          model: DeliveryFeeTier,
          as: 'feeTiers',
          order: [['minDistance', 'ASC']]
        }
      ]
    });
  }
  
  if (!deliveryConfig) {
    throw new ApiError(404, 'No delivery configuration found');
  }
  
  // Check if distance exceeds maximum delivery distance
  if (distance > deliveryConfig.maxDeliveryDistance) {
    return res.status(200).json({
      success: true,
      data: {
        canDeliver: false,
        reason: 'DISTANCE_EXCEEDED',
        maxDistance: deliveryConfig.maxDeliveryDistance,
        message: `Delivery is not available for distances greater than ${deliveryConfig.maxDeliveryDistance} km`
      }
    });
  }
  
  // Check if order amount meets minimum requirement
  if (orderAmount < deliveryConfig.minOrderAmountForDelivery) {
    return res.status(200).json({
      success: true,
      data: {
        canDeliver: false,
        reason: 'MIN_ORDER_NOT_MET',
        minOrderAmount: deliveryConfig.minOrderAmountForDelivery,
        message: `Minimum order amount for delivery is ${deliveryConfig.minOrderAmountForDelivery}`
      }
    });
  }
  
  // Check if order qualifies for free delivery
  if (deliveryConfig.freeDeliveryThreshold && orderAmount >= deliveryConfig.freeDeliveryThreshold) {
    return res.status(200).json({
      success: true,
      data: {
        canDeliver: true,
        deliveryFee: 0,
        message: 'Free delivery'
      }
    });
  }
  
  let deliveryFee = deliveryConfig.baseDeliveryFee;
  
  // Calculate fee based on distance if enabled
  if (deliveryConfig.useDistanceBasedFee) {
    // Check if there are fee tiers
    if (deliveryConfig.feeTiers && deliveryConfig.feeTiers.length > 0) {
      // Find the appropriate tier for the given distance
      const applicableTier = deliveryConfig.feeTiers.find(
        tier => distance >= tier.minDistance && distance <= tier.maxDistance
      );
      
      if (applicableTier) {
        deliveryFee = applicableTier.fee;
      } else {
        // If no tier matches, use base fee + per km fee
        deliveryFee = deliveryConfig.baseDeliveryFee + (distance * deliveryConfig.feePerKilometer);
      }
    } else {
      // No tiers, use base fee + per km fee
      deliveryFee = deliveryConfig.baseDeliveryFee + (distance * deliveryConfig.feePerKilometer);
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      canDeliver: true,
      deliveryFee,
      distance,
      orderAmount,
      config: {
        baseDeliveryFee: deliveryConfig.baseDeliveryFee,
        feePerKilometer: deliveryConfig.feePerKilometer,
        useDistanceBasedFee: deliveryConfig.useDistanceBasedFee
      }
    }
  });
}); 