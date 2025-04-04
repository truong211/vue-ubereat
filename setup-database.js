#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

async function setupDatabase() {
  let connection;
  try {
    // Load environment variables
    dotenv.config({ path: path.join(__dirname, 'backend/.env') });
    
    // Read configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'food_delivery'
    };

    console.log('Starting database setup...');

    // Create connection without database selected
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Drop and recreate database
    await connection.query(`DROP DATABASE IF EXISTS ${dbConfig.database}`);
    await connection.query(`CREATE DATABASE ${dbConfig.database} 
      CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci`);
    console.log(`Database ${dbConfig.database} recreated`);

    // Select the database
    await connection.query(`USE ${dbConfig.database}`);

    // Read SQL file
    const sqlFile = path.join(__dirname, 'food_Delivery.sql');
    const sql = await fs.readFile(sqlFile, 'utf8');
    
    console.log('Executing SQL schema...');
    await connection.query(sql);
    console.log('Database schema created successfully');

    console.log('\nSetup completed successfully!');
    console.log(`Database: ${dbConfig.database}`);
    console.log('Default admin credentials:');
    console.log('Email: admin@fooddelivery.com');
    console.log('Password: admin123 (hashed in database)');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase().catch(console.error);
