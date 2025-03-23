'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      discountPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      categoryId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      isVegetarian: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVegan: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isGlutenFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      spicyLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5
        }
      },
      preparationTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Preparation time in minutes'
      },
      status: {
        type: Sequelize.ENUM('available', 'out_of_stock', 'hidden'),
        defaultValue: 'available'
      },
      isPopular: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isRecommended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      nutritionalInfo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ingredients: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      allergens: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      options: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      dietaryInfo: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('Products', ['categoryId']);
    await queryInterface.addIndex('Products', ['restaurantId']);
    await queryInterface.addIndex('Products', ['status']);
    await queryInterface.addIndex('Products', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};