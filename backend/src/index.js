/**
 * Main application entry point
 */
require('dotenv').config({ path: '../.env' });
const express = require('express');

// Debug: Log DB config and environment at startup
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] DB_HOST:', process.env.DB_HOST);
console.log('[STARTUP] DB_PORT:', process.env.DB_PORT);
console.log('[STARTUP] DB_NAME:', process.env.DB_NAME);
console.log('[STARTUP] DB_USER:', process.env.DB_USER);
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('../models');
const { sequelize } = require('./config/database');
const fixAssociations = require('./scripts/fix-associations');
const promotionMonitoring = require('./services/promotionMonitoring.service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'x-frame-options'
  ],
  exposedHeaders: ['Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Initialize API routes
const appRoutes = require('./app');
app.use(appRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Something went wrong on the server',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize services, database connections, and start the server
async function initialize() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Fix any association issues
    await fixAssociations();
    
    // Start the promotion monitoring service
    promotionMonitoring.start(30); // Check every 30 minutes
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initialize(); 