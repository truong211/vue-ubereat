const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const { userSockets, orderRooms, setIO, getIO } = require('./socketState');
const { handleAdminEvents } = require('./adminHandlers');

// Get JWT secrets from environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-jwt-refresh-secret-key-for-development-only';

// Add a timestamp for when the JWT secret was last updated
// Any tokens issued before this time will be rejected
const JWT_ISSUED_AFTER = Math.floor(Date.now() / 1000);

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowEIO3: true
  });

  // Store io instance
  setIO(io);

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      // Try to get token from different sources
      const token = 
        socket.handshake.auth?.token || 
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        // Allow connection as guest
        socket.user = { id: 'guest', role: 'guest' };
        return next();
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token was issued after our JWT_ISSUED_AFTER timestamp
        if (decoded.iat && decoded.iat < JWT_ISSUED_AFTER) {
          console.log('Socket token was issued before the secret update. Treating as guest...');
          socket.user = { id: 'guest', role: 'guest' };
          return next();
        }
        
        socket.user = {
          id: decoded.id || decoded.userId,
          role: decoded.role || 'customer',
          email: decoded.email
        };
      } catch (error) {
        console.warn('Invalid socket auth token:', error.message);
        // Allow connection as guest even with invalid token
        socket.user = { id: 'guest', role: 'guest' };
      }
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      // Allow connection as guest on error
      socket.user = { id: 'guest', role: 'guest' };
      next();
    }
  });

  // Main namespace connection handler
  io.on('connection', (socket) => {
    const userId = socket.user?.id || 'guest';
    console.log(`User connected: ${userId}, role: ${socket.user?.role}`);
    
    // Store socket in userSockets map
    if (userId !== 'guest') {
      userSockets.set(userId, socket);
    }

    // Handle reconnection
    socket.on('reconnect_attempt', () => {
      console.log(`Reconnection attempt by user: ${userId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${userId} disconnected. Reason: ${reason}`);
      if (userId !== 'guest') {
        userSockets.delete(userId);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error(`Socket connection error for user ${userId}:`, error);
    });
  });

  // Admin namespace with role check middleware
  const adminIo = io.of('/admin');
  adminIo.use((socket, next) => {
    if (socket.user && socket.user.role === 'admin') {
      next();
    } else {
      next(new Error('Unauthorized: Admin access required'));
    }
  });

  // Handle admin connections
  adminIo.on('connection', (socket) => {
    handleAdminEvents(socket, adminIo);
  });

  // Customer namespace
  const customerIo = io.of('/customer');
  customerIo.on('connection', (socket) => {
    const userId = socket.user?.id || 'guest';
    console.log(`Customer connected: ${userId}`);
    handleCustomerEvents(socket, customerIo);
  });

  // Restaurant namespace
  const restaurantIo = io.of('/restaurant');
  restaurantIo.on('connection', (socket) => {
    const userId = socket.user?.id || 'guest';
    console.log(`Restaurant connected: ${userId}`);
    handleRestaurantEvents(socket, restaurantIo);
  });

  // Driver namespace
  const driverIo = io.of('/driver');
  driverIo.on('connection', (socket) => {
    const userId = socket.user?.id || 'guest';
    console.log(`Driver connected: ${userId}`);
    handleDriverEvents(socket, driverIo);
  });

  return io;
}

// Handle customer events
function handleCustomerEvents(socket, io) {
  const userId = socket.user?.id || 'guest';
  userSockets.set(userId, socket);

  // Join order tracking room
  socket.on('track_order', (orderId) => {
    const roomName = `order:${orderId}`;
    socket.join(roomName);
    orderRooms.set(orderId, roomName);
    console.log(`Customer ${userId} joined room ${roomName}`);
  });

  // Leave order tracking room
  socket.on('stop_tracking_order', (orderId) => {
    const roomName = `order:${orderId}`;
    socket.leave(roomName);
    console.log(`Customer ${userId} left room ${roomName}`);
  });

  // Handle chat messages
  socket.on('chat_message', async (data) => {
    const { orderId, message } = data;
    const roomName = `order:${orderId}`;
    
    // Broadcast message to order room
    io.to(roomName).emit('chat_message', {
      orderId,
      message,
      senderId: userId,
      senderType: 'customer',
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    userSockets.delete(userId);
    console.log(`Customer ${userId} disconnected`);
  });
}

// Handle restaurant events
function handleRestaurantEvents(socket, io) {
  const restaurantId = socket.user?.id || 'guest';
  userSockets.set(restaurantId, socket);

  // Update order status
  socket.on('update_order_status', async (data) => {
    const { orderId, status } = data;
    const roomName = `order:${orderId}`;
    
    // Broadcast status update to order room
    io.to(roomName).emit('order_status_updated', {
      orderId,
      status,
      updatedAt: new Date().toISOString()
    });

    // Notify admins of important status changes
    if (['cancelled', 'rejected'].includes(status)) {
      const adminIo = io.of('/admin');
      adminIo.emit('order_status_alert', {
        orderId,
        restaurantId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle chat messages
  socket.on('chat_message', async (data) => {
    const { orderId, message } = data;
    const roomName = `order:${orderId}`;
    
    // Broadcast message to order room
    io.to(roomName).emit('chat_message', {
      orderId,
      message,
      senderId: restaurantId,
      senderType: 'restaurant',
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    userSockets.delete(restaurantId);
    console.log(`Restaurant ${restaurantId} disconnected`);
  });
}

// Handle driver events
function handleDriverEvents(socket, io) {
  const driverId = socket.user?.id || 'guest';
  userSockets.set(driverId, socket);

  // Update driver location
  socket.on('update_location', async (data) => {
    const { orderId, location } = data;
    const roomName = `order:${orderId}`;
    
    // Broadcast location update to order room
    io.to(roomName).emit('driver_location_updated', {
      orderId,
      driverId,
      location,
      timestamp: new Date().toISOString()
    });
  });

  // Update order status
  socket.on('update_order_status', async (data) => {
    const { orderId, status } = data;
    const roomName = `order:${orderId}`;
    
    // Broadcast status update to order room
    io.to(roomName).emit('order_status_updated', {
      orderId,
      status,
      updatedAt: new Date().toISOString()
    });

    // Notify admins of delivery issues
    if (['delivery_failed', 'cannot_deliver'].includes(status)) {
      const adminIo = io.of('/admin');
      adminIo.emit('delivery_issue', {
        orderId,
        driverId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle chat messages
  socket.on('chat_message', async (data) => {
    const { orderId, message } = data;
    const roomName = `order:${orderId}`;
    
    // Broadcast message to order room
    io.to(roomName).emit('chat_message', {
      orderId,
      message,
      senderId: driverId,
      senderType: 'driver',
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    userSockets.delete(driverId);
    console.log(`Driver ${driverId} disconnected`);
  });
}

// Utility function to emit events to specific users
function emitToUser(userId, event, data) {
  const socket = userSockets.get(userId);
  if (socket) {
    socket.emit(event, data);
  }
}

// Utility function to emit events to order rooms
function emitToOrder(orderId, event, data) {
  const roomName = `order:${orderId}`;
  const io = getIO();
  if (io) {
    io.to(roomName).emit(event, data);
  }
}

module.exports = {
  initializeSocketIO,
  emitToUser,
  emitToOrder
};