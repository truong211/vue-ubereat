const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

class Banner extends Model {}

Banner.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.ENUM('home_top', 'home_middle', 'sidebar'),
    defaultValue: 'home_top'
  },
  link: {
    type: DataTypes.STRING
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiryDate: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'Banner',
  tableName: 'banners',
  timestamps: true
})

module.exports = Banner