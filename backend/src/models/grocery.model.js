module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('Grocery', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8
      },
      comment: 'Category types: 1=Fruits/Vegetables, 2=Dairy, 3=Meat/Seafood, 4=Bakery, 5=Pantry, 6=Beverages, 7=Snacks, 8=Household'
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'groceries',
    timestamps: true
  });

  // Add hook to initialize demo data after sync
  model.afterSync(async () => {
    try {
      const count = await model.count();
      if (count === 0) {
        await model.bulkCreate([
          {
            name: 'Fresh Organic Bananas',
            description: 'Sweet and ripe organic bananas, perfect for smoothies or snacks',
            price: 2.99,
            image: '/img/groceries/bananas.jpg',
            category: 1,
            popularity: 95,
            stock: 100
          },
          {
            name: 'Organic Whole Milk',
            description: 'Fresh local organic whole milk, 1 gallon',
            price: 4.99,
            image: '/img/groceries/milk.jpg',
            category: 2,
            popularity: 90,
            stock: 50
          },
          {
            name: 'Fresh Chicken Breast',
            description: 'Boneless, skinless chicken breast, 1 lb',
            price: 6.99,
            image: '/img/groceries/chicken.jpg',
            category: 3,
            popularity: 88,
            stock: 75
          },
          {
            name: 'Artisan Sourdough Bread',
            description: 'Freshly baked artisan sourdough bread',
            price: 5.99,
            image: '/img/groceries/bread.jpg',
            category: 4,
            popularity: 85,
            stock: 30
          },
          {
            name: 'Organic Brown Rice',
            description: 'Organic brown rice, 2 lb bag',
            price: 3.99,
            image: '/img/groceries/rice.jpg',
            category: 5,
            popularity: 82,
            stock: 200
          },
          {
            name: 'Fresh Orange Juice',
            description: 'Freshly squeezed orange juice, 64 oz',
            price: 5.99,
            image: '/img/groceries/juice.jpg',
            category: 6,
            popularity: 87,
            stock: 40
          },
          {
            name: 'Mixed Nuts',
            description: 'Premium mixed nuts, unsalted, 1 lb',
            price: 9.99,
            image: '/img/groceries/nuts.jpg',
            category: 7,
            popularity: 80,
            stock: 60
          },
          {
            name: 'Paper Towels',
            description: 'Premium paper towels, 6 rolls',
            price: 7.99,
            image: '/img/groceries/paper-towels.jpg',
            category: 8,
            popularity: 92,
            stock: 150
          },
          {
            name: 'Fresh Avocados',
            description: 'Ripe Hass avocados, 3 count',
            price: 4.99,
            image: '/img/groceries/avocados.jpg',
            category: 1,
            popularity: 89,
            stock: 45
          },
          {
            name: 'Greek Yogurt',
            description: 'Plain Greek yogurt, 32 oz',
            price: 4.49,
            image: '/img/groceries/yogurt.jpg',
            category: 2,
            popularity: 86,
            stock: 80
          },
          {
            name: 'Fresh Salmon Fillet',
            description: 'Wild-caught salmon fillet, 1 lb',
            price: 12.99,
            image: '/img/groceries/salmon.jpg',
            category: 3,
            popularity: 84,
            stock: 25
          },
          {
            name: 'Organic Eggs',
            description: 'Farm fresh organic eggs, dozen',
            price: 5.99,
            image: '/img/groceries/eggs.jpg',
            category: 2,
            popularity: 93,
            stock: 100
          }
        ]);
        console.log('Demo groceries data initialized');
      }
    } catch (error) {
      console.error('Error initializing demo groceries:', error);
    }
  });

  return model;
};