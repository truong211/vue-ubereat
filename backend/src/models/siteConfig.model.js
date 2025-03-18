const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

class SiteConfig extends Model {}

SiteConfig.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  contactEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  supportPhone: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'SiteConfig',
  tableName: 'site_config',
  timestamps: true
})

module.exports = SiteConfig