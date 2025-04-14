// A script to fix database schema issues by adding missing columns
const db = require('../../models');
const sequelize = db.sequelize;

// Helper function to safely add a column to a table
const safelyAddColumn = async (tableName, columnName, columnDefinition) => {
  try {
    // First check if the column already exists
    const [columnInfo] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
    `, {
      replacements: [tableName, columnName],
      type: sequelize.QueryTypes.SELECT
    });
    
    // If column already exists, just log and return
    if (columnInfo) {
      console.log(`Column ${columnName} already exists in ${tableName} - skipping`);
      return false;
    }
    
    // Column doesn't exist, try to add it
    await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    console.log(`Added ${columnName} column to ${tableName} table`);
    return true;
  } catch (err) {
    // Handle any type of duplication error
    if (err.name === 'SequelizeDatabaseError' && 
       (err.parent?.code === 'ER_DUP_FIELDNAME' || 
        err.message.includes('Duplicate column'))) {
      console.log(`Column ${columnName} already exists in ${tableName} - skipping`);
      return false;
    } else {
      // Log other types of errors
      console.error(`Error adding ${columnName} column to ${tableName}:`, err.message);
      return false;
    }
  }
};

const fixSchema = async () => {
  try {
    console.log('Starting database schema fixes...');
    
    // Fix 1: Add productId column to reviews table if missing
    await safelyAddColumn('reviews', 'productId', 'INT NULL');
    
    // Add foreign key constraint if possible
    try {
      await sequelize.query(`
        ALTER TABLE reviews 
        ADD CONSTRAINT fk_review_product 
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
      `);
      console.log('Added foreign key constraint for productId in reviews table');
    } catch (err) {
      // This might fail if the constraint already exists or the column already has values
      console.log('Note: Foreign key constraint was not added, it might already exist or the column has invalid values.');
    }
    
    // Fix 2: Add averageRating column to restaurants table if missing
    await safelyAddColumn('restaurants', 'averageRating', 'DECIMAL(3,2) DEFAULT 0.00');
    
    // Update the averageRating column based on existing reviews
    try {
      await sequelize.query(`
        UPDATE restaurants r
        SET averageRating = (
          SELECT AVG(rating)
          FROM reviews rv
          WHERE rv.restaurantId = r.id
        )
        WHERE EXISTS (
          SELECT 1
          FROM reviews rv
          WHERE rv.restaurantId = r.id
        )
      `);
      console.log('Updated averageRating values based on existing reviews');
    } catch (err) {
      console.error('Error updating averageRating values:', err.message);
    }
    
    console.log('Database schema fixes completed successfully');
  } catch (err) {
    console.error('Error fixing database schema:', err);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Run the fixes
fixSchema();