const mysql = require('mysql2/promise');
require('dotenv').config();

async function runCartMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'food_delivery',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read and execute migration script
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'scripts/cart-migration.sql'), 'utf8');
    
    console.log('🔄 Running cart migration...');
    await connection.execute(migrationSQL);
    
    console.log('✅ Cart migration completed successfully!');
    
    // Verify tables exist
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'product_options'
    `);
    
    if (tables.length > 0) {
      console.log('✅ Product options tables created');
    }
    
    // Check cart table structure
    const [cartStructure] = await connection.execute(`
      DESCRIBE cart
    `);
    
    console.log('✅ Cart table structure:');
    cartStructure.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type}`);
    });
    
    // Test promotion codes
    const [promotions] = await connection.execute(`
      SELECT code, name, type, value FROM promotions WHERE isActive = 1
    `);
    
    console.log('✅ Active promotion codes:');
    promotions.forEach(promo => {
      console.log(`   - ${promo.code}: ${promo.name} (${promo.type}: ${promo.value})`);
    });
    
    console.log('\n🎉 Cart and ordering system is ready!');
    console.log('\n📋 Features available:');
    console.log('   ✅ Add/edit/delete cart items');
    console.log('   ✅ Product options (size, toppings)');
    console.log('   ✅ Special notes for items/orders');
    console.log('   ✅ View cart totals');
    console.log('   ✅ Delivery address selection');
    console.log('   ✅ Scheduled delivery');
    console.log('   ✅ Promotion codes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
if (require.main === module) {
  runCartMigration()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runCartMigration;