const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'MarketingContent',
  timestamps: true
});

module.exports = MarketingContent;