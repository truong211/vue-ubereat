const { hashPassword, verifyPassword } = require('../src/utils/password.util');
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
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(72), // Increase length to safely store bcrypt hash (60-72 chars)
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 100] // Validate original password length before hashing
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'restaurant_owner', 'delivery_driver'),
      defaultValue: 'customer'
    },
    profileImage: {
      type: DataTypes.STRING,
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
    verificationData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Stores all verification related data including OTPs and expiry times'
    },
    socialProvider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Combined verification and reset tokens into verificationData above
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'en'
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Stores user preferences including notifications and favorites'
    }
  }, {
    timestamps: true
  });

  User.associate = function(models) {
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });

    User.hasMany(models.Review, {
      foreignKey: 'userId',
      as: 'reviews'
    });

    // Add any other associations here
  };

  // Hook to hash password before creating a user - now using our utility
  User.beforeCreate(async (user, options) => {
    if (user.password) {
      console.log('--- DEBUG: Password Hashing in Model Hook ---');
      console.log('Original Password Length:', user.password.length);

      // IMPORTANT: Convert to string WITHOUT trimming
      const passwordToHash = String(user.password);

      // Use the new password utility for consistent hashing
      user.password = await hashPassword(passwordToHash);

      console.log('Generated Hash Length:', user.password.length);
    }
  });

  // Hook to hash password before updating - now using our utility
  User.beforeUpdate(async (user, options) => {
    if (user.changed('password')) {
      console.log('--- DEBUG: Password Hashing on Update ---');
      console.log('Original Password Length:', user.password.length);

      // IMPORTANT: Convert to string WITHOUT trimming
      const passwordToHash = String(user.password);

      // Use the new password utility for consistent hashing
      user.password = await hashPassword(passwordToHash);

      console.log('Generated Hash Length:', user.password.length);
    }
  });

  // Static method for password validation - now using our utility
  User.correctPassword = async (candidatePassword, userPassword) => {
    console.log('--- DEBUG: Password Validation on Login ---');

    // Input validation with detailed logging
    if (!userPassword || !candidatePassword) {
      console.log('Missing password input:', {
        hasUserPassword: !!userPassword,
        hasCandidatePassword: !!candidatePassword
      });
      return false;
    }

    // IMPORTANT: Convert to string WITHOUT trimming
    const passwordToVerify = String(candidatePassword);

    console.log('Login Password Length:', passwordToVerify.length);
    console.log('Stored Password Hash Length:', userPassword.length);

    // Use direct bcrypt compare for consistency
    const result = await bcrypt.compare(passwordToVerify, userPassword);

    console.log('Password validation result:', result);
    return result;
  };

  // Instance method for password validation that uses the static method
  User.prototype.validatePassword = async function(candidatePassword) {
    return User.correctPassword(candidatePassword, this.password);
  };

  // Find user by email - convenience method
  User.findByEmail = async function(email) {
    return this.findOne({ where: { email } });

  };

  return User;
};