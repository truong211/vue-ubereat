const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('../../models');
const createMissingTables = require('./create-missing-tables');
const fixAssociations = require('./fix-associations');

// Function to initialize database
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // First create any missing tables
    await createMissingTables();
    
    // Then fix any association issues
    await fixAssociations();
    
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the function
initializeDatabase(); 