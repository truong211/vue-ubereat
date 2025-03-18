/**
 * Database Setup Script for Uber Eats Clone
 * 
 * This script assists in setting up the MySQL database for the application.
 * It creates the database if it doesn't exist and imports the schema.
 * 
 * Usage:
 * 1. Make sure MySQL is installed and running
 * 2. Update the config object with your MySQL credentials
 * 3. Run: node setup-database.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function setupDatabase() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server');

    // Read SQL file
    const sqlFile = await fs.readFile(path.join(__dirname, 'food_Delivery.sql'), 'utf8');

    // Split SQL file into individual statements
    const statements = sqlFile.split(';').filter(statement => statement.trim());

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('Executed SQL statement successfully');
      }
    }

    // Create upload directories if they don't exist
    const uploadDirs = ['categories', 'banners', 'products', 'restaurants', 'profiles'];
    for (const dir of uploadDirs) {
      const dirPath = path.join(__dirname, 'backend', 'uploads', dir);
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Created upload directory: ${dir}`);
    }

    console.log('Database setup completed successfully');
    await connection.end();
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();