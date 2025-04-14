const { sequelize, Product } = require('../models');

async function syncProductTable() {
  try {
    // Sync only the Product model with alter:true to add missing columns
    await Product.sync({ alter: true });
    console.log('Product table has been synchronized');
    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing Product table:', error);
    process.exit(1);
  }
}

syncProductTable();