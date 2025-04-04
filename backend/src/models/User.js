const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    favoriteFoods: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    favoriteRestaurants: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  // Add a food to user's favorites
  User.prototype.addFavoriteFood = async function(foodId) {
    const favoriteFoods = this.favoriteFoods || [];
    if (!favoriteFoods.includes(Number(foodId))) {
      favoriteFoods.push(Number(foodId));
      this.favoriteFoods = favoriteFoods;
      await this.save();
    }
    return this.favoriteFoods;
  };

  // Remove a food from user's favorites
  User.prototype.removeFavoriteFood = async function(foodId) {
    let favoriteFoods = this.favoriteFoods || [];
    favoriteFoods = favoriteFoods.filter(id => Number(id) !== Number(foodId));
    this.favoriteFoods = favoriteFoods;
    await this.save();
    return this.favoriteFoods;
  };

  // Check if a food is user's favorite
  User.prototype.hasFavoriteFood = function(foodId) {
    const favoriteFoods = this.favoriteFoods || [];
    return favoriteFoods.some(id => Number(id) === Number(foodId));
  };

  // Get all favorite foods
  User.prototype.getFavoriteFoods = async function() {
    const favoriteFoods = this.favoriteFoods || [];
    if (favoriteFoods.length === 0) {
      return [];
    }
    
    // Assuming Product model is available in this scope
    const foods = await sequelize.models.Product.findAll({
      where: {
        id: favoriteFoods
      },
      include: [
        {
          association: 'restaurant',
          attributes: ['id', 'name', 'image_url']
        },
        {
          association: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return foods;
  };

  // Add a restaurant to user's favorites
  User.prototype.addFavoriteRestaurant = async function(restaurantId) {
    const favoriteRestaurants = this.favoriteRestaurants || [];
    if (!favoriteRestaurants.includes(Number(restaurantId))) {
      favoriteRestaurants.push(Number(restaurantId));
      this.favoriteRestaurants = favoriteRestaurants;
      await this.save();
    }
    return this.favoriteRestaurants;
  };

  // Remove a restaurant from user's favorites
  User.prototype.removeFavoriteRestaurant = async function(restaurantId) {
    let favoriteRestaurants = this.favoriteRestaurants || [];
    favoriteRestaurants = favoriteRestaurants.filter(id => Number(id) !== Number(restaurantId));
    this.favoriteRestaurants = favoriteRestaurants;
    await this.save();
    return this.favoriteRestaurants;
  };

  // Check if a restaurant is user's favorite
  User.prototype.hasFavoriteRestaurant = function(restaurantId) {
    const favoriteRestaurants = this.favoriteRestaurants || [];
    return favoriteRestaurants.some(id => Number(id) === Number(restaurantId));
  };

  // Get all favorite restaurants
  User.prototype.getFavoriteRestaurants = async function() {
    const favoriteRestaurants = this.favoriteRestaurants || [];
    if (favoriteRestaurants.length === 0) {
      return [];
    }
    
    // Assuming Restaurant model is available in this scope
    const restaurants = await sequelize.models.Restaurant.findAll({
      where: {
        id: favoriteRestaurants
      },
      attributes: ['id', 'name', 'description', 'address', 'logo', 'cuisineType', 'priceRange', 'rating']
    });
    
    return restaurants;
  };

  // Set up associations
  User.associate = function(models) {
    // Define associations here if needed
  };

  return User;
}; 