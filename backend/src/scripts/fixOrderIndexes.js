require('dotenv').config();
const sequelize = require('../config/database');

async function fixOrderIndexes() {
  try {
    console.log('Starting to fix order table indexes...');
    
    // Direct database query to drop any existing unique constraint on orderNumber
    try {
      console.log('Attempting to drop unique constraint on orderNumber...');
      await sequelize.query('ALTER TABLE orders DROP INDEX orderNumber;');
      console.log('Successfully dropped unique constraint.');
    } catch (error) {
      console.log('No unique constraint found or error dropping constraint:', error.message);
    }
    
    // Create a new unique index, but only if it doesn't exist
    try {
      console.log('Creating a new unique index on orderNumber...');
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS order_number_unique ON orders (orderNumber);');
      console.log('Successfully created a new unique index.');
    } catch (error) {
      console.log('Error creating unique index:', error.message);
      
      // Try an alternative approach for MySQL
      try {
        console.log('Trying alternative approach for MySQL...');
        await sequelize.query(`
          SELECT COUNT(1) IndexIsThere FROM INFORMATION_SCHEMA.STATISTICS
          WHERE table_schema=DATABASE() AND table_name='orders' AND index_name='order_number_unique'
        `);
        const [results] = await sequelize.query(`
          SELECT COUNT(1) IndexCount FROM INFORMATION_SCHEMA.STATISTICS
          WHERE table_schema=DATABASE() AND table_name='orders' AND index_name='order_number_unique'
        `);
        const indexExists = results[0].IndexCount > 0;
        
        if (!indexExists) {
          await sequelize.query('CREATE UNIQUE INDEX order_number_unique ON orders (orderNumber);');
          console.log('Created index using MySQL approach.');
        } else {
          console.log('Index already exists, no action needed.');
        }
      } catch (mysqlError) {
        console.log('Error with MySQL approach:', mysqlError.message);
      }
    }
    
    console.log('Order table index fix completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing order indexes:', error);
    process.exit(1);
  }
}

// Run the fix
fixOrderIndexes(); 