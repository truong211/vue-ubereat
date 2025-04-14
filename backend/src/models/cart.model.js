/**
 * Cart Model with Sequelize implementation
 * Represents user shopping carts in the system
 */
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'restaurants',
        key: 'id'
      },
      comment: 'Carts are limited to items from a single restaurant'
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of cart items with product details'
    },
    totalItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    couponCode: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'carts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId'],
        name: 'idx_cart_user'
      }
    ]
  });

  // Associations
  Cart.associate = (models) => {
    Cart.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Cart.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant',
      onDelete: 'SET NULL'
    });
  };

  // Update cart totals when items change
  Cart.beforeCreate = Cart.beforeUpdate = async (cart) => {
    if (cart.changed('items') && Array.isArray(cart.items)) {
      // Calculate totalItems
      cart.totalItems = cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
      
      // Calculate subtotal
      cart.subtotal = cart.items.reduce((total, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 0);
        return total + (price * quantity);
      }, 0);
      
      // Calculate total
      cart.total = parseFloat(cart.subtotal) + parseFloat(cart.deliveryFee) + parseFloat(cart.tax) - parseFloat(cart.discount);
      cart.total = Math.max(0, parseFloat(cart.total.toFixed(2)));
      
      // Update lastActivity
      cart.lastActivity = new Date();
    }
  };

  // Class methods
  Cart.findAllWithDetails = async function(where = {}, orderBy = []) {
    return await this.findAll({
      where,
      order: orderBy,
      include: [
        {
          model: sequelize.models.Product,
          as: 'product',
          include: [
            {
              model: sequelize.models.Restaurant,
              as: 'restaurant',
              attributes: [
                'id', 'name', 'logo', 'deliveryFee',
                'minimumOrderAmount', 'estimatedDeliveryTime', 'averageRating'
              ]
            }
          ]
        }
      ]
    });
  };

  return Cart;
};
