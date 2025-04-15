const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Restaurant extends Model {
  static associate(models) {
    Restaurant.hasMany(models.Product, {
      foreignKey: 'restaurantId',
      as: 'products'
    });
    
    Restaurant.hasMany(models.Order, {
      foreignKey: 'restaurantId',
      as: 'orders'
    });

    Restaurant.hasMany(models.Review, {
      foreignKey: 'restaurantId',
      as: 'reviews'
    });

    Restaurant.hasOne(models.DeliveryConfig, {
      foreignKey: 'restaurantId',
      as: 'deliveryConfig'
    });

    Restaurant.belongsToMany(models.Category, {
      through: 'RestaurantCategories',
      foreignKey: 'restaurantId',
      otherKey: 'categoryId',
      as: 'categories'
    });
  }
}

Restaurant.init({
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
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  logo: {
    type: DataTypes.STRING
  },
  coverImage: {
    type: DataTypes.STRING
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  isOpen: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  businessHours: {
    type: DataTypes.JSON
  },
  deliveryZones: {
    type: DataTypes.JSON
  },
  cuisine: {
    type: DataTypes.JSON
  },
  features: {
    type: DataTypes.JSON
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  preparationTime: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Restaurant',
  tableName: 'restaurants',
  timestamps: true
});

module.exports = Restaurant; 