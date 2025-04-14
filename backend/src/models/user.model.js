const { DataTypes } = require('sequelize');
const { hashPassword, verifyPassword } = require('../utils/password.util');

module.exports = (sequelize) => {
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
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await hashPassword(user.password);
        }
      }
    }
  });

  // Static method for password validation
  User.correctPassword = async (candidatePassword, userPassword) => {
    return await verifyPassword(candidatePassword, userPassword);
  };

  // Instance method for password validation
  User.prototype.validatePassword = async function(candidatePassword) {
    return User.correctPassword(candidatePassword, this.password);
  };

  // Find user by email - convenience method
  User.findByEmail = async function(email) {
    return this.findOne({ where: { email } });
  };

  return User;
};
