# Sequelize Models

This directory contains the Sequelize model definitions for our Food Delivery application. Each model corresponds to a table in the database, providing a structured interface for database operations.

## Model Structure

Each model file follows a similar structure:

```javascript
module.exports = (sequelize, DataTypes) => {
  const ModelName = sequelize.define('ModelName', {
    // Column definitions
  }, {
    // Model options
  });

  // Associations
  ModelName.associate = (models) => {
    // Relationships with other models
  };

  // Hooks
  ModelName.beforeCreate = async (instance, options) => {
    // Operations before record creation
  };

  return ModelName;
};
```

## Available Models

- **User**: User accounts with various roles (admin, customer, restaurant, driver)
- **Restaurant**: Restaurant details
- **Category**: Food categories, which can be system-wide or restaurant-specific
- **Product**: Food items available for purchase
- **Order**: Customer orders
- **OrderItem**: Individual items within an order
- **Review**: Customer reviews for restaurants and orders
- **ReviewVote**: Helpfulness votes for reviews
- **Address**: User addresses for delivery
- **Cart**: User shopping carts

## Associations

Models are connected through associations (relationships) defined in their respective `associate` methods. Common association types used in this application are:

- **belongsTo**: Indicates that this model is a child of another model
- **hasMany**: Indicates that this model is a parent of many instances of another model
- **hasOne**: Indicates that this model is a parent of a single instance of another model

## Hooks

Hooks provide a way to run code at specific points in a model's lifecycle, such as:

- **beforeCreate**: Before a record is created
- **afterCreate**: After a record is created
- **beforeUpdate**: Before a record is updated
- **afterUpdate**: After a record is updated
- **beforeDestroy**: Before a record is deleted

## Creating New Models

You can create new models by:

1. Manually creating a model file following the pattern in existing models
2. Using the model generator script:

```bash
node src/scripts/generate-model.js table_name
```

## Usage Example

Here's an example of how to use these models in your code:

```javascript
const { User, Order, Restaurant } = require('../models');

// Find a user with their orders
const user = await User.findByPk(userId, {
  include: [
    {
      model: Order,
      as: 'orders',
      include: [
        {
          model: Restaurant,
          as: 'restaurant'
        }
      ]
    }
  ]
});

// Create a new product
const newProduct = await Product.create({
  restaurantId: 1,
  categoryId: 2,
  name: 'Delicious Pizza',
  description: 'Classic pizza with cheese and tomato',
  price: 12.99,
  isAvailable: true
});
```

## Database Initialization

You can initialize the database structure using:

```bash
node src/scripts/init-db.js
```

This will create all tables defined by the models and seed some initial data.

## Best Practices

1. Always use the model's validation capabilities
2. Leverage associations to keep your code DRY
3. Use transactions for operations spanning multiple models
4. Let Sequelize handle timestamps (createdAt, updatedAt)
5. Use hooks sparingly and for clearly defined purposes 