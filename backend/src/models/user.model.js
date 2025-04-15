const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

class User extends Model {
  async comparePassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  }

  passwordChangedAfter(timestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        new Date(this.passwordChangedAt).getTime() / 1000,
        10
      );
      return timestamp < changedTimestamp;
    }
    return false;
  }
  
  // Static method to update login timestamp
  static async updateLoginTimestamp(userId) {
    try {
      return await this.update(
        { lastLogin: new Date() },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Error updating login timestamp:', error);
      return false;
    }
  }
  
  // Static method to find user by email
  static async findByEmail(email) {
    try {
      return await this.findOne({
        where: { email }
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
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
    allowNull: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
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
    defaultValue: 'vi'
  },
  notificationPreferences: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'notification_preferences'
  },
  favoriteRestaurants: {
    type: DataTypes.JSON,
    allowNull: true
  },
  favoriteDishes: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

module.exports = User;
