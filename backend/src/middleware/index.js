const authMiddleware = require('./auth.middleware');

const authJwt = {
  verifyToken: authMiddleware.verifyToken,
  isAdmin: authMiddleware.isAdmin,
  isRestaurant: authMiddleware.isRestaurant,
  isDriver: authMiddleware.isDriver,
  isCustomer: authMiddleware.isCustomer,
  optionalToken: authMiddleware.optionalToken
};

module.exports = {
  authJwt
}; 