const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Category = require('./category.model');
const Product = require('./product.model');
const Order = require('./order.model');
const OrderDetail = require('./orderDetail.model');
const Review = require('./review.model');
const Promotion = require('./promotion.model');
const Cart = require('./cart.model');
const Address = require('./address.model');

// Additional associations can be defined here if needed

module.exports = {
  User,
  Restaurant,
  Category,
  Product,
  Order,
  OrderDetail,
  Review,
  Promotion,
  Cart,
  Address
}; 