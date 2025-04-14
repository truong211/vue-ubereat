'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TokenBlacklist extends Model {
    static async addToBlacklist(token) {
      try {
        await this.create({
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        return true;
      } catch (error) {
        console.error('Error adding token to blacklist:', error);
        return false;
      }
    }

    static async isBlacklisted(token) {
      try {
        const blacklistedToken = await this.findOne({
          where: {
            token,
            expiresAt: {
              [sequelize.Sequelize.Op.gt]: new Date()
            }
          }
        });
        return !!blacklistedToken;
      } catch (error) {
        console.error('Error checking token blacklist:', error);
        return false;
      }
    }

    static async cleanupExpired() {
      try {
        await this.destroy({
          where: {
            expiresAt: {
              [sequelize.Sequelize.Op.lt]: new Date()
            }
          }
        });
      } catch (error) {
        console.error('Error cleaning up expired tokens:', error);
      }
    }
  }

  TokenBlacklist.init({
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TokenBlacklist',
    tableName: 'token_blacklists',
    timestamps: true
  });

  return TokenBlacklist;
};