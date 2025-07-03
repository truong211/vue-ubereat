/**
 * Models Index File
 */

const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Order = require('./order.model');
const Product = require('./product.model');
const Category = require('./category.model');
const Review = require('./review.model');
const SiteConfig = require('./siteConfig.model');
const Banner = require('./banner.model');
const DeliveryConfig = require('./deliveryConfig.model');
const DeliveryFeeTier = require('./deliveryFeeTier.model');
const Cart = require('./cart.model');
const Address = require('./address.model');
const Promotion = require('./promotion.model');
const ProductOption = require('./productOption.model');
const ProductOptionChoice = require('./productOptionChoice.model');

// Add custom association methods instead of using Sequelize-style associations
// These will be used by the controllers to fetch related data

// Add method to fetch fee tiers for a delivery config
DeliveryConfig.getFeeTiers = async (deliveryConfigId) => {
  return await DeliveryFeeTier.findAll({ 
    where: { deliveryConfigId }
  }, 'ORDER BY minDistance ASC');
};

// Add method to fetch restaurant for a delivery config
DeliveryConfig.getRestaurant = async (restaurantId) => {
  if (!restaurantId) return null;
  return await Restaurant.findByPk(restaurantId);
};

// Add method to fetch delivery config for a restaurant
Restaurant.getDeliveryConfig = async (restaurantId) => {
  return await DeliveryConfig.findOne({ 
    where: { restaurantId, isActive: true }
  });
};

module.exports = {
  User,
  Restaurant,
  Order,
  Product,
  Category,
  Review,
  SiteConfig,
  Banner,
  DeliveryConfig,
  DeliveryFeeTier,
  Cart,
  Address,
  Promotion,
  ProductOption,
  ProductOptionChoice
}; 