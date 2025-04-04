require('dotenv').config(); // Load environment variables FIRST

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const session = require('express-session');
const { initializeSocketIO } = require('./socket/handlers');
const { setIO } = require('./socket/socketServer');
const socketStateMonitor = require('./socket/stateMonitor');

// Import routes
const authRoutes = require('./routes/auth.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const userRoutes = require('./routes/user.routes');
const userSingularRoutes = require('./routes/user-singular.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const restaurantSettingsRoutes = require('./routes/restaurantSettings.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const promotionRoutes = require('./routes/promotion.routes');
const paymentRoutes = require('./routes/payment.routes');
const staticPageRoutes = require('./routes/staticPage.routes');
const siteConfigRoutes = require('./routes/siteConfig.routes');
const trackingRoutes = require('./routes/tracking.routes');
const notificationRoutes = require('./routes/notification.routes');
const menuRoutes = require('./routes/menu.routes');
const articleRoutes = require('./routes/article.routes');
const bannerRoutes = require('./routes/banner.routes');
const addressRoutes = require('./routes/address.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const loyaltyRoutes = require('./routes/loyalty.routes');
const reviewResponseRoutes = require('./routes/review-response.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const adminRoutes = require('./routes/admin.routes');
const faqRoutes = require('./routes/faq.routes');
const deliveryConfigRoutes = require('./routes/deliveryConfig.routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

// Import database connection
const db = require('./config/database');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with our handlers
const io = initializeSocketIO(server);
setIO(io);

// Load promotion notifications with try/catch
let promotionNotifications = null;
try {
  const PromotionNotifications = require('./socket/promotionNotifications');
  promotionNotifications = new PromotionNotifications(io);
  console.log('Promotion notifications service loaded successfully');
} catch (error) {
  console.error('Error loading promotion notifications service:', error);
}

// Load promotion monitoring service with try/catch
try {
  const promotionMonitoring = require('./services/promotionMonitoring.service');
  
  // Check if setIo method exists before calling it
  if (promotionMonitoring && typeof promotionMonitoring.setIo === 'function') {
    promotionMonitoring.setIo(io);
    console.log('Promotion monitoring service initialized with Socket.IO');
  }
  
  console.log('Promotion monitoring service loaded successfully');
} catch (error) {
  console.error('Error loading promotion monitoring service:', error);
}

// Start socket state monitoring
socketStateMonitor.start();

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
console.log('CORS Origin set to:', corsOrigin);

app.use(cors({
  origin: [corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'uber_eats_clone_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/user', authMiddleware, userSingularRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/restaurant-settings', restaurantSettingsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pages', staticPageRoutes);
app.use('/api/config', siteConfigRoutes);
app.use('/api/tracking', authMiddleware, trackingRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/addresses', authMiddleware, addressRoutes);
app.use('/api/favorites', authMiddleware, favoriteRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/review-responses', reviewResponseRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/delivery-configs', deliveryConfigRoutes);

// Admin routes with debugging middleware
app.use('/api/admin', (req, res, next) => {
  console.log('Admin API Request:', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.method === 'GET' ? undefined : req.body
  });
  next();
}, adminRoutes);

// Add the same admin routes without the /api prefix to handle frontend requests
app.use('/admin', (req, res, next) => {
  console.log('Admin Direct Request:', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.method === 'GET' ? undefined : req.body
  });
  next();
}, adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root admin redirect
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Test database connection
db.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    
    // Create missing tables if they don't exist
    const createMissingTables = async () => {
      try {
        // Check and create user_favorites table
        await db.query(`
          CREATE TABLE IF NOT EXISTS user_favorites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            itemId INT NOT NULL,
            type ENUM('food', 'restaurant', 'category') NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY favorite_user_item_type (userId, itemId, type)
          )
        `);
        console.log('Checked/created user_favorites table');
        
        // Update notifications table to include isSystemWide and validUntil fields
        try {
          // First check if the columns exist using separate try-catch blocks for each column
          let hasSystemWideColumn = false;
          let hasValidUntilColumn = false;
          
          try {
            const [columnsResult] = await db.query(`
              SHOW COLUMNS FROM notifications LIKE 'isSystemWide'
            `);
            hasSystemWideColumn = columnsResult.length > 0;
          } catch (err) {
            console.error('Error checking for isSystemWide column:', err);
          }
          
          try {
            const [validUntilResult] = await db.query(`
              SHOW COLUMNS FROM notifications LIKE 'validUntil'
            `);
            hasValidUntilColumn = validUntilResult.length > 0;
          } catch (err) {
            console.error('Error checking for validUntil column:', err);
          }
          
          // Add each column separately to handle errors individually
          if (!hasSystemWideColumn) {
            try {
              await db.query('ALTER TABLE notifications ADD COLUMN isSystemWide BOOLEAN DEFAULT FALSE');
              console.log('Added isSystemWide column to notifications table');
            } catch (err) {
              if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('isSystemWide column already exists');
              } else {
                console.error('Error adding isSystemWide column:', err);
              }
            }
          }
          
          if (!hasValidUntilColumn) {
            try {
              await db.query('ALTER TABLE notifications ADD COLUMN validUntil DATETIME');
              console.log('Added validUntil column to notifications table');
            } catch (err) {
              if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('validUntil column already exists');
              } else {
                console.error('Error adding validUntil column:', err);
              }
            }
          }
          
          // Modify userId column always
          try {
            await db.query('ALTER TABLE notifications MODIFY COLUMN userId INT NULL');
            console.log('Modified userId column in notifications table');
          } catch (err) {
            console.error('Error modifying userId column:', err);
          }
          
          console.log('Updated notifications table schema');
        } catch (err) {
          console.error('Error updating notifications table:', err);
        }
      } catch (err) {
        console.error('Error creating missing tables:', err);
      }
    };
    
    // Run the table creation
    createMissingTables();
    
    // No need for synchronization since we're using the SQL file directly
    return Promise.resolve();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  socketStateMonitor.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io };