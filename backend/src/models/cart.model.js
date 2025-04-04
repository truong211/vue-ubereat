const { DataTypes } = require('sequelize');

/**
 * Cart Model
 * Represents user shopping carts in the system
 */
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: { // Renamed from userId
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use table name string
        key: 'id'
      }
    },
    product_id: { // Renamed from productId
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products', // Use table name string
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    underscored: true, // Added underscored
    tableName: 'cart', // Table name is already snake_case
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'] // Updated fields
      }
    ]
  });

  // Define associations with an associate method
  Cart.associate = function(models) {
    Cart.belongsTo(models.user, { foreignKey: 'user_id', as: 'user' });
    Cart.belongsTo(models.product, { foreignKey: 'product_id', as: 'product' });
  };

  return Cart;
};