const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PromotionCategory = require('./promotionCategory.model');

const PromotionCampaign = sequelize.define('PromotionCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: PromotionCategory,
      key: 'id'
    }
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Maximum budget allocated for this campaign'
  },
  spentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total amount spent on discounts in this campaign'
  },
  targetAudience: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Target audience criteria'
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Campaign performance metrics'
  }
}, {
  timestamps: true,
  tableName: 'promotion_campaigns'
});

// Define associations
PromotionCampaign.belongsTo(PromotionCategory, { foreignKey: 'categoryId', as: 'category' });
PromotionCategory.hasMany(PromotionCampaign, { foreignKey: 'categoryId', as: 'campaigns' });

module.exports = PromotionCampaign;