/**
 * Restaurant model with Sequelize implementation
 */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  console.log('Initializing Restaurant model with sequelize instance:', !!sequelize);
  console.log('DataTypes available:', Object.keys(DataTypes));
  
  class Restaurant extends Model {

    static associate(models) {
      if (!models) {
        console.error('No models object provided to Restaurant.associate');
        return;
      }

      console.log('Restaurant.associate - Available models:', Object.keys(models));

      console.log('Setting up Restaurant associations with:', Object.keys(models));
      
      const { RestaurantSettings, User, Category, Product, Order, Review } = models;

      if (RestaurantSettings) {
        this.hasOne(RestaurantSettings, {
          foreignKey: 'restaurantId',
          as: 'settings',
          onDelete: 'CASCADE'
        });
        console.log('Restaurant-RestaurantSettings association set up');
      } else {
        console.warn('RestaurantSettings model not found');
      }

      if (User) {
        this.belongsTo(User, {
          foreignKey: 'ownerId',
          as: 'owner'
        });
      }

      if (Category) {
        this.hasMany(Category, {
          foreignKey: 'restaurantId',
          as: 'categories'
        });
      }

      if (Product) {
        this.hasMany(Product, {
          foreignKey: 'restaurantId',
          as: 'products'
        });
      }

      if (Order) {
        this.hasMany(Order, {
          foreignKey: 'restaurantId',
          as: 'orders'
        });
      }

      if (Review) {
        this.hasMany(Review, {
          foreignKey: 'restaurantId',
          as: 'reviews'
        });
      }
    }

    async getDeliveryConfig() {
      if (!this.DeliveryConfig) {
        console.error('DeliveryConfig association not found');
        return null;
      }
      return await this.getDeliveryConfig({ where: { isActive: true } });
    }
  }

  Restaurant.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    coverImage: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    openingHours: {
      type: DataTypes.JSON,
      allowNull: true
    },
    specialHolidays: {
      type: DataTypes.JSON,
      allowNull: true
    },
    cuisineType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    priceRange: {
      type: DataTypes.ENUM('$', '$$', '$$$', '$$$$'),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    estimatedDeliveryTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'restaurants',
    modelName: 'Restaurant',
    timestamps: true
  });
  console.log('Restaurant model initialized with name:', Restaurant.name);
  return Restaurant;
};
