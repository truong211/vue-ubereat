const { handleUserStatusEvents } = require('./userStatusHandlers');

// ...existing imports...

function initializeSockets(server) {
  const io = socketIO(server);

  // Middleware for authentication
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    // ...existing handlers...

    // User status events
    handleUserStatusEvents(socket, io);
  });

  return io;
}

// ...rest of the file...