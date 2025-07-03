'use strict';

const sequelize = require('../../config/sequelize');
const User = require('./user.model');
const UserProfileHistory = require('./userProfileHistory.model');
const Address = require('./address.model');

// ----------------------------------------------------------------------------
// Associations
// ----------------------------------------------------------------------------
User.hasMany(UserProfileHistory, {
  foreignKey: 'user_id',
  as: 'profileHistory',
});
UserProfileHistory.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(Address, {
  foreignKey: 'user_id',
  as: 'addresses',
});
Address.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  sequelize,
  User,
  UserProfileHistory,
  Address,
};