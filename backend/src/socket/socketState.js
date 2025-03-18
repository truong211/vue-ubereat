// Map to store user socket connections
const userSockets = new Map();

// Map to store order tracking rooms
const orderRooms = new Map();

// Map to store restaurant monitoring rooms
const restaurantRooms = new Map();

// Map to store user monitoring rooms
const userRooms = new Map();

// Store socket.io instance
let io = null;

function setIO(ioInstance) {
  io = ioInstance;
}

function getIO() {
  return io;
}

module.exports = {
  userSockets,
  orderRooms,
  restaurantRooms,
  userRooms,
  setIO,
  getIO
};