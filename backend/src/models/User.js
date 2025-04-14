const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

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
      allowNull: true,
      unique: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'customer',
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      allowNull: false
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationOtp: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    phoneVerificationOtp: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    phoneVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordOtp: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    socialProvider: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    socialId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    socialToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    preferredLanguage: {
      type: DataTypes.STRING(10),
      defaultValue: 'en'
    },
    notificationPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        email: true,
        push: true,
        sms: false
      }
    },
    favoriteFoods: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    favoriteRestaurants: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    favoriteDishes: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      // Hash password before creating a user
      beforeCreate: async (user) => {
        if (user.password) {
          // Convert password to string if needed, but don't trim it
          const passwordToHash = typeof user.password === 'string' 
            ? user.password 
            : user.password.toString();
          
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(passwordToHash, salt);
        }
      },
      // Hash password before updating a user if password changes
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          // Convert password to string if needed, but don't trim it
          const passwordToHash = typeof user.password === 'string' 
            ? user.password 
            : user.password.toString();
          
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(passwordToHash, salt);
        }
      }
    }
  });

  // Static method for password comparison
  User.correctPassword = async (candidatePassword, userPassword) => {
    try {
      if (!userPassword) {
        console.log('Password comparison failed: No stored password hash');
        return false;
      }
      
      if (!candidatePassword) {
        console.log('Password comparison failed: No candidate password provided');
        return false;
      }
      
      // Convert to string but DO NOT trim the password - this could be causing the issue
      const passwordToTest = typeof candidatePassword === 'string' 
        ? candidatePassword 
        : candidatePassword.toString();
      
      console.log('--- DEBUG: Pre-Comparison Values ---');
      console.log('Plaintext Password Length:', passwordToTest.length);
      console.log('Stored Password Hash Length:', userPassword.length);
      
      // Use pure bcrypt compare without any modifications to the input
      const bcryptCompare = require('bcryptjs').compare;
      const isMatch = await bcryptCompare(passwordToTest, userPassword);
      console.log('Password validation result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  };

  // Instance method for password validation
  User.prototype.validatePassword = async function(candidatePassword) {
    return User.correctPassword(candidatePassword, this.password);
  };
  
  // Update last login timestamp for a user
  User.updateLoginTimestamp = async function(userId) {
    return this.update(
      { lastLogin: new Date() },
      { where: { id: userId } }
    );
  };

  // Find user by email - convenience method
  User.findByEmail = async function(email) {
    return this.findOne({ where: { email } });
  };

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