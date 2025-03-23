const { userSockets } = require('./socketState');
const { User } = require('../models');

function handleUserStatusEvents(socket, io) {
  const userId = socket.user?.id;
  if (!userId) return;

  // Join user's room for personal notifications
  socket.join(`user:${userId}`);

  // Listen for status changes
  socket.on('status_change', async (data) => {
    const { targetUserId, status, reason } = data;
    
    // Only admins can change status
    if (socket.user.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const user = await User.findByPk(targetUserId);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      await user.update({
        isActive: status === 'active',
        adminNotes: status === 'suspended' ? reason : null
      });

      // Emit to all admins
      io.to('admin').emit('user_status_changed', {
        userId: targetUserId,
        status,
        reason,
        updatedBy: socket.user.id,
        timestamp: new Date().toISOString()
      });

      // Emit to the affected user
      io.to(`user:${targetUserId}`).emit('account_status_changed', {
        status,
        reason,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating user status:', error);
      socket.emit('error', { message: 'Failed to update user status' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    userSockets.delete(userId);
  });
}

module.exports = {
  handleUserStatusEvents
};