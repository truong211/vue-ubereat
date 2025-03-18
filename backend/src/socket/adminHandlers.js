const { userSockets, orderRooms } = require('./socketState');
const { Restaurant, User, Order } = require('../models');
const { emitToUser } = require('./handlers');

function handleAdminEvents(socket, io) {
  const adminId = socket.user.id;
  userSockets.set(adminId, socket);

  // Join admin monitoring room
  socket.join('admin-monitoring');

  // Subscribe to system metrics
  socket.on('subscribe_metrics', () => {
    socket.join('system-metrics');
  });

  // Unsubscribe from system metrics
  socket.on('unsubscribe_metrics', () => {
    socket.leave('system-metrics');
  });

  // Update notification preferences
  socket.on('update_notification_preferences', (preferences) => {
    socket.notificationPreferences = preferences;
  });

  // Handle admin actions on alerts
  socket.on('acknowledge_alert', async (data) => {
    const { alertId, action, notes } = data;
    // Broadcast acknowledgment to all admins
    io.to('admin-monitoring').emit('alert_acknowledged', {
      alertId,
      adminId,
      action,
      notes,
      timestamp: new Date().toISOString()
    });
  });

  // Handle monitoring specific restaurant
  socket.on('monitor_restaurant', (restaurantId) => {
    const roomName = `restaurant:${restaurantId}`;
    socket.join(roomName);
  });

  // Stop monitoring specific restaurant
  socket.on('stop_monitoring_restaurant', (restaurantId) => {
    const roomName = `restaurant:${restaurantId}`;
    socket.leave(roomName);
  });

  // Monitor user activity
  socket.on('monitor_user', (userId) => {
    const roomName = `user:${userId}`;
    socket.join(roomName);
  });

  // Stop monitoring user activity
  socket.on('stop_monitoring_user', (userId) => {
    const roomName = `user:${userId}`;
    socket.leave(roomName);
  });

  // Handle admin broadcast messages
  socket.on('broadcast_message', (data) => {
    const { target, message, type } = data;
    switch (target) {
      case 'all_restaurants':
        io.of('/restaurant').emit('admin_broadcast', { message, type });
        break;
      case 'all_drivers':
        io.of('/driver').emit('admin_broadcast', { message, type });
        break;
      case 'all_customers':
        io.of('/customer').emit('admin_broadcast', { message, type });
        break;
      case 'all':
        io.emit('admin_broadcast', { message, type });
        break;
    }
  });

  // Handle admin actions on reported content
  socket.on('handle_report', async (data) => {
    const { reportId, action, reason } = data;
    io.to('admin-monitoring').emit('report_handled', {
      reportId,
      adminId,
      action,
      reason,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    userSockets.delete(adminId);
    console.log(`Admin ${adminId} disconnected`);
  });
}

// Utility functions for admin notifications
function notifyAdmins(event, data) {
  const io = require('./socketServer').getIO();
  if (io) {
    io.to('admin_notifications').emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

async function notifyAdminNewRestaurant(restaurant) {
  notifyAdmins('new_restaurant_application', {
    restaurantId: restaurant.id,
    name: restaurant.name,
    type: 'RESTAURANT_APPLICATION',
    title: 'New Restaurant Application',
    message: `${restaurant.name} has applied for registration`
  });
}

async function notifyAdminOrderIssue(order, issue) {
  notifyAdmins('order_issue_reported', {
    orderId: order.id,
    type: 'ORDER_ISSUE',
    title: 'Order Issue Reported',
    message: `Issue reported for order #${order.orderNumber}: ${issue}`
  });
}

async function notifyAdminUserReport(reportData) {
  notifyAdmins('user_reported', {
    ...reportData,
    type: 'USER_REPORT',
    title: 'User Reported',
    message: `User ${reportData.reportedUserId} has been reported for ${reportData.reason}`
  });
}

module.exports = {
  handleAdminEvents,
  notifyAdminNewRestaurant,
  notifyAdminOrderIssue,
  notifyAdminUserReport
};