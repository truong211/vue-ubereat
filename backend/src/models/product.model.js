const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Check if Restaurant model exists before setting up association
      if (!models.Restaurant) {
        console.error('Restaurant model not found when setting up Product associations');
        console.log('Available models:', Object.keys(models));
        return;
      }

      Product.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant',
        onDelete: 'CASCADE'
      });

      if (models.Category) {
        Product.belongsTo(models.Category, {
          foreignKey: 'categoryId',
          as: 'category',
          onDelete: 'SET NULL'
        });
      }

      if (models.OrderItem) {
        Product.hasMany(models.OrderItem, {
          foreignKey: 'productId',
          as: 'orderItems',
          onDelete: 'SET NULL'
        });
      }

      if (models.Review) {
        Product.hasMany(models.Review, {
          foreignKey: 'productId',
          as: 'reviews'
        });
      }
    }

    // Hook for virtual fields
    static afterFind(products) {
      if (!products) return;
      
      const productsArray = Array.isArray(products) ? products : [products];
      
      productsArray.forEach(product => {
        if (!product.dataValues) return;
        
        const totalSales = (product.orders && Array.isArray(product.orders)) ? product.orders.length : 0;
        product.setDataValue('totalSales', totalSales);
        
        if (product.reviews && product.reviews.length > 0) {
          const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / product.reviews.length;
          product.setDataValue('averageRating', averageRating);
        } else {
          product.setDataValue('averageRating', 0);
        }
      });
    }
  }

  Product.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discountPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    allergens: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Preparation time in minutes'
    },
    isSpicy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVegan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isGlutenFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    nutritionInfo: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'products',
    modelName: 'Product',
    timestamps: true,
    indexes: [
      {
        name: 'idx_product_restaurant',
        fields: ['restaurantId']
      },
      {
        name: 'idx_product_category',
        fields: ['categoryId']
      }
    ],
    hooks: {
      afterFind: Product.afterFind
    }
  });

  return Product;
};
