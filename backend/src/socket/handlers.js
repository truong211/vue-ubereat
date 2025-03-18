const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const { userSockets, orderRooms, setIO, getIO } = require('./socketState');
const { handleAdminEvents } = require('./adminHandlers');

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store io instance
  setIO(io);

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
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
    console.log(`Customer connected: ${socket.user.id}`);
    handleCustomerEvents(socket, customerIo);
  });

  // Restaurant namespace
  const restaurantIo = io.of('/restaurant');
  restaurantIo.on('connection', (socket) => {
    console.log(`Restaurant connected: ${socket.user.id}`);
    handleRestaurantEvents(socket, restaurantIo);
  });

  // Driver namespace
  const driverIo = io.of('/driver');
  driverIo.on('connection', (socket) => {
    console.log(`Driver connected: ${socket.user.id}`);
    handleDriverEvents(socket, driverIo);
  });

  return io;
}

// Handle customer events
function handleCustomerEvents(socket, io) {
  const userId = socket.user.id;
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
  const restaurantId = socket.user.id;
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
  const driverId = socket.user.id;
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