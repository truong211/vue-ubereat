const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

/**
 * User Model
 * Represents users in the system (customers, restaurant owners, admins)
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // Changed to allow null for social login
    validate: {
      len: [6, 255]
    }
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'customer', 'restaurant', 'driver'),
    defaultValue: 'customer'
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
  // Email verification with OTP
  emailVerificationOtp: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Phone verification with OTP
  phoneVerificationOtp: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  phoneVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Password reset with OTP
  resetPasswordOtp: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Social login fields
  socialProvider: {
    type: DataTypes.ENUM('local', 'google', 'facebook', 'apple'),
    defaultValue: 'local'
  },
  socialId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  socialToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Legacy verification fields
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
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // User preferences
  preferredLanguage: {
    type: DataTypes.STRING(10),
    defaultValue: 'vi'
  },
  notificationPreferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      email: true,
      push: true,
      sms: false
    }
  },
  // Favorite restaurants and dishes (stored as JSON arrays of IDs)
  favoriteRestaurants: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  favoriteDishes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance method to check if password is correct
User.prototype.correctPassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to hide sensitive data when converting to JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.socialToken;
  delete values.verificationToken;
  delete values.resetPasswordToken;
  delete values.emailVerificationOtp;
  delete values.phoneVerificationOtp;
  delete values.resetPasswordOtp;
  return values;
};

module.exports = User;