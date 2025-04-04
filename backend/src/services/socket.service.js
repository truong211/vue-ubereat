/**
 * Socket.io service for managing real-time communications
 */

// Store for active socket connections
let io = null;
const userSockets = new Map(); // userId -> socket id
const orderSockets = new Map(); // orderId -> socket ids[]

/**
 * Initialize socket.io instance
 * @param {Object} socketIo - The socket.io instance
 */
exports.initialize = (socketIo) => {
  io = socketIo;
  
  // Set up socket connection handlers
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Handle user authentication
    socket.on('authenticate', (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      }
    });
    
    // Handle order tracking room join
    socket.on('join_order', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        
        if (!orderSockets.has(orderId)) {
          orderSockets.set(orderId, []);
        }
        
        orderSockets.get(orderId).push(socket.id);
        socket.orderId = orderId;
        console.log(`Socket ${socket.id} joined order ${orderId}`);
      }
    });
    
    // Handle order tracking room leave
    socket.on('leave_order', (orderId) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
        
        if (orderSockets.has(orderId)) {
          const sockets = orderSockets.get(orderId).filter(id => id !== socket.id);
          if (sockets.length > 0) {
            orderSockets.set(orderId, sockets);
          } else {
            orderSockets.delete(orderId);
          }
        }
        
        console.log(`Socket ${socket.id} left order ${orderId}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Remove from user sockets
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }
      
      // Remove from order sockets
      if (socket.orderId) {
        const orderId = socket.orderId;
        if (orderSockets.has(orderId)) {
          const sockets = orderSockets.get(orderId).filter(id => id !== socket.id);
          if (sockets.length > 0) {
            orderSockets.set(orderId, sockets);
          } else {
            orderSockets.delete(orderId);
          }
        }
      }
    });
  });
};

/**
 * Emit an event to a specific user
 * @param {string} userId - The user ID
 * @param {string} event - The event name
 * @param {Object} data - The data to send
 */
exports.emitToUser = (userId, event, data) => {
  if (!io) return false;
  
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  
  return false;
};

/**
 * Emit an event to all users tracking an order
 * @param {string} orderId - The order ID
 * @param {string} event - The event name
 * @param {Object} data - The data to send
 */
exports.emitToOrder = (orderId, event, data) => {
  if (!io) return false;
  
  io.to(`order_${orderId}`).emit(event, data);
  return true;
};

/**
 * Emit an event to all connected clients
 * @param {string} event - The event name
 * @param {Object} data - The data to send
 */
exports.emitToAll = (event, data) => {
  if (!io) return false;
  
  io.emit(event, data);
  return true;
};

/**
 * Get socket instance
 * @returns {Object} - The socket.io instance
 */
exports.getIo = () => {
  return io;
}; 