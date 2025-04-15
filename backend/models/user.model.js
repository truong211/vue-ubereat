const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order, { foreignKey: 'userId' });
      User.hasMany(models.Review, { foreignKey: 'userId' });
      User.hasMany(models.Address, { foreignKey: 'userId' });
      User.hasMany(models.Loyalty, { foreignKey: 'userId' });
      User.belongsToMany(models.Restaurant, { 
        through: 'Favorites',
        foreignKey: 'userId',
        as: 'favoriteRestaurants'
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Null for social login users
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^\+?[\d\s-]{10,15}$/
      }
    },
    role: {
      type: DataTypes.ENUM('customer', 'restaurant', 'driver', 'admin'),
      defaultValue: 'customer'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationOtp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneVerificationOtp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordOtp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    otpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['phone'],
        where: {
          phone: { [sequelize.Op.ne]: null }
        }
      },
      {
        unique: true,
        fields: ['username'],
        where: {
          username: { [sequelize.Op.ne]: null }
        }
      },
      {
        fields: ['socialProvider', 'socialId']
      }
    ]
  });

  // Instance method to safely return user data without sensitive information
  User.prototype.toSafeObject = function() {
    const { 
      password, socialToken, verificationToken, resetPasswordToken,
      emailVerificationOtp, phoneVerificationOtp, resetPasswordOtp,
      ...safeUser 
    } = this.toJSON();
    
    return safeUser;
  };

  return User;
};
