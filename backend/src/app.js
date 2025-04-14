require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
// const csrf = require('csurf'); // Temporarily comment out CSRF
const { getDb } = require('./models');
const { apiLimiter } = require('./middleware/rate-limit.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function initializeApp() {
  try {
    // Initialize database connection
    const db = await getDb();
    console.log('Database initialized successfully');

    // Request logging middleware
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      console.log('Headers:', req.headers);
      next();
    });

    // CORS configuration - Put this BEFORE Helmet
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

    // Enhanced Security Headers with Helmet - Make it more permissive for development
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false
    }));

    // Body parsing middleware with size limits - Put this BEFORE routes
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parser middleware with enhanced security
    app.use(cookieParser());

    // Temporarily disable CSRF
    /*
    app.use(csrf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
        maxAge: 3600 // 1 hour
      }
    }));

    // Provide CSRF token
    app.get('/api/csrf-token', (req, res) => {
      res.json({ csrfToken: req.csrfToken() });
    });
    */

    // Health check endpoint (before any middleware)
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'API is running' });
    });

    // Apply rate limiting to all API routes
    app.use('/api', apiLimiter);

    // Load all route modules
    const routes = {
      auth: require('./routes/auth.routes'),
      user: require('./routes/user.routes'),
      restaurant: require('./routes/restaurant.routes'),
      restaurantSettings: require('./routes/restaurantSettings.routes'),
      order: require('./routes/order.routes'),
      grocery: require('./routes/grocery.routes'),
      category: require('./routes/category.routes'),
      product: require('./routes/product.routes'),
      page: require('./routes/page.routes'),
      notification: require('./routes/notification.routes'),
      favorites: require('./routes/favorites.routes')
    };

    // Register API routes in specific order
    app.use('/api/auth', routes.auth); // Auth routes first
    app.use('/api/pages', routes.page); // Public routes next
    app.use('/api/categories', routes.category);
    app.use('/api/products', routes.product);
    app.use('/api/restaurants', routes.restaurant);
    app.use('/api/restaurant-settings', routes.restaurantSettings);
    app.use('/api/users', routes.user);
    app.use('/api/notifications', routes.notification);
    app.use('/api/orders', routes.order);
    app.use('/api/groceries', routes.grocery);
    app.use('/api/favorites', routes.favorites);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();

module.exports = app;