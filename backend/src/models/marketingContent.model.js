'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketingContent = sequelize.define('MarketingContent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contentType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type: email_campaign, app_notification, banner, promotion, etc.'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'HTML content, message text, or image URL'
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'completed', 'cancelled'),
      defaultValue: 'draft'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    targetAudience: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON containing targeting criteria'
    },
    channels: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of distribution channels: email, push, sms, in_app'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'MarketingContent',
    timestamps: true
  });

  // Add associations
  MarketingContent.associate = function(models) {
    if (models.User) {
      MarketingContent.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  };

  return MarketingContent;
};