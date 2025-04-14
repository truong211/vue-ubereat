'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('groceries', [
      {
        name: 'Fresh Organic Bananas',
        description: 'Sweet and ripe organic bananas, perfect for smoothies or snacks',
        price: 2.99,
        image: '/img/groceries/bananas.jpg',
        category: 1,
        popularity: 95,
        stock: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Whole Milk',
        description: 'Fresh local organic whole milk, 1 gallon',
        price: 4.99,
        image: '/img/groceries/milk.jpg',
        category: 2,
        popularity: 90,
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fresh Chicken Breast',
        description: 'Boneless, skinless chicken breast, 1 lb',
        price: 6.99,
        image: '/img/groceries/chicken.jpg',
        category: 3,
        popularity: 88,
        stock: 75,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Artisan Sourdough Bread',
        description: 'Freshly baked artisan sourdough bread',
        price: 5.99,
        image: '/img/groceries/bread.jpg',
        category: 4,
        popularity: 85,
        stock: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Brown Rice',
        description: 'Organic brown rice, 2 lb bag',
        price: 3.99,
        image: '/img/groceries/rice.jpg',
        category: 5,
        popularity: 82,
        stock: 200,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice, 64 oz',
        price: 5.99,
        image: '/img/groceries/juice.jpg',
        category: 6,
        popularity: 87,
        stock: 40,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mixed Nuts',
        description: 'Premium mixed nuts, unsalted, 1 lb',
        price: 9.99,
        image: '/img/groceries/nuts.jpg',
        category: 7,
        popularity: 80,
        stock: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Paper Towels',
        description: 'Premium paper towels, 6 rolls',
        price: 7.99,
        image: '/img/groceries/paper-towels.jpg',
        category: 8,
        popularity: 92,
        stock: 150,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fresh Avocados',
        description: 'Ripe Hass avocados, 3 count',
        price: 4.99,
        image: '/img/groceries/avocados.jpg',
        category: 1,
        popularity: 89,
        stock: 45,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Greek Yogurt',
        description: 'Plain Greek yogurt, 32 oz',
        price: 4.49,
        image: '/img/groceries/yogurt.jpg',
        category: 2,
        popularity: 86,
        stock: 80,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fresh Salmon Fillet',
        description: 'Wild-caught salmon fillet, 1 lb',
        price: 12.99,
        image: '/img/groceries/salmon.jpg',
        category: 3,
        popularity: 84,
        stock: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Eggs',
        description: 'Farm fresh organic eggs, dozen',
        price: 5.99,
        image: '/img/groceries/eggs.jpg',
        category: 2,
        popularity: 93,
        stock: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('groceries', null, {});
  }
};