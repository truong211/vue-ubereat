module.exports = (sequelize, DataTypes) => {
  const Restaurant = sequelize.define('Restaurant', {
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
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
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bannerImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    cuisine: {
      type: DataTypes.STRING,
      allowNull: true
    },
    priceRange: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 4
      }
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 0,
      allowNull: false
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 0,
      allowNull: false
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    averageDeliveryTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    featuredPosition: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    minimumOrder: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    acceptsOnlinePayment: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true
  });

  Restaurant.associate = function(models) {
    Restaurant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'owner'
    });

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
  };

  return Restaurant;
};