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

const { exec } = require('child_process');
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Database configuration - using credentials from .env file
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_delivery'
};

// Path to schema file
const schemaFilePath = path.join(__dirname, 'backend', 'src', 'config', 'schema.sql');

// Create a connection without database selected
const connection = mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password
});

// Create database if it doesn't exist
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  
  console.log('Connected to MySQL server successfully!');
  
  connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`, (err) => {
    if (err) {
      console.error('Error creating database:', err.message);
      connection.end();
      return;
    }
    
    console.log(`Database '${config.database}' created or already exists.`);
    
    // Read and execute schema file
    fs.readFile(schemaFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading schema file:', err.message);
        connection.end();
        return;
      }
      
      console.log('Schema file read successfully.');
      
      // Connect to the created database
      connection.changeUser({ database: config.database }, (err) => {
        if (err) {
          console.error('Error connecting to database:', err.message);
          connection.end();
          return;
        }
        
        console.log(`Connected to database '${config.database}'.`);
        
        // Split the schema into separate commands
        const commands = data.split(';').filter(cmd => cmd.trim() !== '');
        
        // Execute each command sequentially
        executeCommands(commands, 0, () => {
          console.log('Schema imported successfully!');
          console.log('\nDatabase setup complete! You can now start the application:');
          console.log('1. cd backend && npm run dev');
          console.log('2. cd frontend && npm run dev');
          connection.end();
        });
      });
    });
  });
});

// Function to execute SQL commands sequentially
function executeCommands(commands, index, callback) {
  if (index >= commands.length) {
    callback();
    return;
  }
  
  const command = commands[index].trim();
  if (command === '') {
    executeCommands(commands, index + 1, callback);
    return;
  }
  
  connection.query(command, (err) => {
    if (err) {
      console.error(`Error executing command: ${command.substring(0, 50)}...`);
      console.error(err.message);
    }
    
    executeCommands(commands, index + 1, callback);
  });
} 