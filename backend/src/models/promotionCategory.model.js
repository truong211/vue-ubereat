const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromotionCategory = sequelize.define('PromotionCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'promotion_categories'
});

module.exports = PromotionCategory;