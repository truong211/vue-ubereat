const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Promotion = require('./promotion.model');
const Order = require('./order.model');

/**
 * UserPromotion Model
 * Tracks promotion usage by users
 */
const UserPromotion = sequelize.define('UserPromotion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  promotionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Promotion,
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Order,
      key: 'id'
    },
    comment: 'The order where this promotion was applied'
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'The actual discount amount applied'
  },
  orderTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'The order total before discount'
  }
}, {
  timestamps: true,
  tableName: 'user_promotions',
  indexes: [
    {
      fields: ['userId', 'promotionId'],
      name: 'user_promotion_idx'
    }
  ]
});

// Define associations
UserPromotion.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserPromotion.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });
UserPromotion.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(UserPromotion, { foreignKey: 'userId', as: 'usedPromotions' });
Promotion.hasMany(UserPromotion, { foreignKey: 'promotionId', as: 'usages' });
Order.hasOne(UserPromotion, { foreignKey: 'orderId', as: 'appliedPromotion' });

module.exports = UserPromotion;