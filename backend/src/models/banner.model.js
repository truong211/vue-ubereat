const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Banner extends Model {}

Banner.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'home_top'
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  device: {
    type: DataTypes.ENUM('all', 'mobile', 'desktop'),
    defaultValue: 'all'
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Banner',
  tableName: 'banners',
  timestamps: true,
  hooks: {
    beforeCreate: (banner) => {
      if (banner.expiryDate) {
        banner.expiryDate = new Date(banner.expiryDate);
      }
    },
    beforeUpdate: (banner) => {
      if (banner.expiryDate) {
        banner.expiryDate = new Date(banner.expiryDate);
      }
    }
  }
});

module.exports = Banner;