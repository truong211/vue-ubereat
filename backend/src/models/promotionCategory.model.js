'use strict';

module.exports = (sequelize, DataTypes) => {
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

  // Define associations
  PromotionCategory.associate = function(models) {
    if (models.PromotionCampaign) {
      PromotionCategory.hasMany(models.PromotionCampaign, {
        foreignKey: 'category_id',
        as: 'campaigns',
        constraints: false
      });
    }
  };

  return PromotionCategory;
};