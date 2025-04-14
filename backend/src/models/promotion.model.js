/**
 * Promotion model with Sequelize implementation
 */
module.exports = (sequelize, DataTypes) => {
  const Promotion = sequelize.define('Promotion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed_amount', 'free_delivery'),
      defaultValue: 'percentage'
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    maxDiscountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 means unlimited'
    },
    currentUsage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    perUserLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '0 means unlimited'
    },
    appliesTo: {
      type: DataTypes.ENUM('all', 'restaurants', 'categories', 'products'),
      defaultValue: 'all'
    },
    eligibleIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'IDs of restaurants, categories, or products this promotion applies to'
    },
    userRestrictions: {
      type: DataTypes.ENUM('all', 'new_users', 'existing_users', 'specific_users'),
      defaultValue: 'all'
    },
    eligibleUserIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'IDs of users this promotion is available to, if userRestrictions is specific_users'
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    terms: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'promotions',
    timestamps: true,
    indexes: [
      {
        name: 'idx_promotion_code',
        unique: true,
        fields: ['code']
      },
      {
        name: 'idx_promotion_date',
        fields: ['startDate', 'endDate']
      },
      {
        name: 'idx_promotion_active',
        fields: ['isActive']
      }
    ]
  });

  // Associations
  Promotion.associate = (models) => {
    Promotion.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant'
    });

    Promotion.belongsToMany(models.Product, {
      through: 'product_promotions',
      foreignKey: 'promotionId',
      otherKey: 'productId',
      as: 'products'
    });
  };

  // Class methods
  Promotion.getProducts = async function(promotionId) {
    return await sequelize.models.Product.findAll({
      include: [{
        model: sequelize.models.Promotion,
        as: 'promotions',
        where: { id: promotionId }
      }]
    });
  };

  return Promotion;
};
