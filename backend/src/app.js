const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const passport = require('./config/passport');
const session = require('express-session');
const { initializeSocketIO } = require('./socket/handlers');
const { setIO } = require('./socket/socketServer');
const socketStateMonitor = require('./socket/stateMonitor');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
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

// Start socket state monitoring
socketStateMonitor.start();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'uber_eats_clone_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
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
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Test database connection
db.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    
    // Sync database models
    return db.sync({ alter: process.env.NODE_ENV === 'development' });
  })
  .then(() => {
    console.log('Database synchronized successfully.');
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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io };