'use strict';

module.exports = (sequelize, DataTypes) => {
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
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Maximum budget allocated for this campaign'
    },
    spent_amount: {
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
  PromotionCampaign.associate = function(models) {
    if (models.PromotionCategory) {
      PromotionCampaign.belongsTo(models.PromotionCategory, {
        foreignKey: 'category_id',
        as: 'category',
        constraints: false
      });
    }
    
    if (models.Promotion) {
      PromotionCampaign.hasMany(models.Promotion, {
        foreignKey: 'campaign_id',
        as: 'promotions',
        constraints: false
      });
    }
  };

  return PromotionCampaign;
};