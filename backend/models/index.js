'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Import models manually
db.Article = require('./article.model')(sequelize, Sequelize.DataTypes);
db.Banner = require('./banner.model')(sequelize, Sequelize.DataTypes);
db.Notification = require('./notification.model')(sequelize, Sequelize.DataTypes);
db.Promotion = require('./promotion.model')(sequelize, Sequelize.DataTypes);
db.ReviewResponse = require('./reviewResponse.model')(sequelize, Sequelize.DataTypes);

// Import loyalty models (multiple models in one file)
const loyaltyModels = require('./loyalty.model')(sequelize, Sequelize.DataTypes);
db.Loyalty = loyaltyModels.Loyalty;
db.LoyaltyReward = loyaltyModels.LoyaltyReward;
db.LoyaltyRedemption = loyaltyModels.LoyaltyRedemption;

// Import other models dynamically (if they exist)
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-9) === '.model.js' &&
      file !== 'article.model.js' &&
      file !== 'banner.model.js' &&
      file !== 'notification.model.js' &&
      file !== 'promotion.model.js' &&
      file !== 'reviewResponse.model.js' &&
      file !== 'loyalty.model.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;