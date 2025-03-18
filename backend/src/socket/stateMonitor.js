const { getIO } = require('./socketServer');
const { userSockets, orderRooms, restaurantRooms, userRooms } = require('./socketState');

class SocketStateMonitor {
  constructor() {
    this.metrics = {
      connections: {
        total: 0,
        customers: 0,
        restaurants: 0,
        drivers: 0,
        admins: 0
      },
      rooms: {
        orders: 0,
        restaurants: 0,
        users: 0
      },
      events: {
        sent: 0,
        received: 0
      }
    };

    this.startTime = Date.now();
    this.updateInterval = null;
  }

  start() {
    // Update metrics every 5 seconds
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.broadcastMetrics();
    }, 5000);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateMetrics() {
    const io = getIO();
    if (!io) return;

    // Get namespace sockets
    const customerSockets = io.of('/customer').sockets;
    const restaurantSockets = io.of('/restaurant').sockets;
    const driverSockets = io.of('/driver').sockets;
    const adminSockets = io.of('/admin').sockets;

    // Update connection metrics
    this.metrics.connections = {
      total: userSockets.size,
      customers: customerSockets.size,
      restaurants: restaurantSockets.size,
      drivers: driverSockets.size,
      admins: adminSockets.size
    };

    // Update room metrics
    this.metrics.rooms = {
      orders: orderRooms.size,
      restaurants: restaurantRooms.size,
      users: userRooms.size
    };

    // Add system uptime
    this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
  }

  broadcastMetrics() {
    const io = getIO();
    if (!io) return;

    // Only send metrics to admin namespace
    io.of('/admin').emit('system_metrics', {
      timestamp: new Date().toISOString(),
      metrics: this.metrics
    });
  }

  // Track event metrics
  trackEvent(type) {
    if (type === 'sent') {
      this.metrics.events.sent++;
    } else if (type === 'received') {
      this.metrics.events.received++;
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics
    };
  }
}

// Create singleton instance
const socketStateMonitor = new SocketStateMonitor();

module.exports = socketStateMonitor;