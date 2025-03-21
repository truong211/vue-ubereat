const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

class StaticPage extends Model {}

StaticPage.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'StaticPage',
  tableName: 'static_pages',
  timestamps: true
})

module.exports = StaticPage