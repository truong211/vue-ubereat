const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const promotionRoutes = require('./routes/promotion.routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

// Import database connection
const db = require('./config/database');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join a room based on user ID
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Join a restaurant room for restaurant staff
  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`Joined restaurant room ${restaurantId}`);
  });
  
  // Handle order status updates
  socket.on('orderStatusUpdate', (data) => {
    // Broadcast to specific user
    io.to(`user_${data.userId}`).emit('orderUpdate', data);
    // Broadcast to restaurant staff
    io.to(`restaurant_${data.restaurantId}`).emit('orderUpdate', data);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export for testing
module.exports = { app, server, io }; 