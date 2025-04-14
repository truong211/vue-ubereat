const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      if (!models) {
        console.error('No models object provided to Order.associate');
        return;
      }

      const { User, Restaurant, OrderItem, Review } = models;

      if (User) {
        this.belongsTo(User, {
          foreignKey: 'userId',
          as: 'customer',
          onDelete: 'NO ACTION'
        });

        this.belongsTo(User, {
          foreignKey: 'driverId',
          as: 'driver',
          onDelete: 'SET NULL'
        });
      }

      if (Restaurant) {
        this.belongsTo(Restaurant, {
          foreignKey: 'restaurantId',
          as: 'restaurant',
          onDelete: 'NO ACTION'
        });
      }

      if (OrderItem) {
        this.hasMany(OrderItem, {
          foreignKey: 'orderId',
          as: 'items',
          onDelete: 'CASCADE'
        });
      }

      if (Review) {
        this.hasOne(Review, {
          foreignKey: 'orderId',
          as: 'review',
          onDelete: 'SET NULL'
        });
      }
    }
  }

  Order.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ),
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    tip: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'debit_card', 'paypal', 'cash', 'stripe', 'momo', 'vnpay'),
      allowNull: false,
      defaultValue: 'credit_card'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentInfo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    paymentIntentId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    deliveryMethod: {
      type: DataTypes.ENUM('delivery', 'pickup'),
      allowNull: false,
      defaultValue: 'delivery'
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveryInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isRated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    hooks: {
      beforeCreate: async (order) => {
        if (!order.orderNumber) {
          const date = new Date();
          const prefix = 'ORD';
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const timestamp = Math.floor(date.getTime() / 1000).toString().slice(-6);
          order.orderNumber = `${prefix}${timestamp}${randomPart}`;
        }
      }
    }
  });

  return Order;
};
