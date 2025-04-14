const { userSockets } = require('./socketState');
const SupportTicket = require('../models/supportTicket.model');
const SupportMessage = require('../models/supportMessage.model');
const User = require('../models/user.model');

/**
 * Handle support-related socket events
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io namespace
 */
function handleSupportEvents(socket, io) {
  const userId = socket.user?.id || 'guest';
  
  // Join user's personal support room
  if (userId !== 'guest') {
    const userRoom = `support:user:${userId}`;
    socket.join(userRoom);
    console.log(`User ${userId} joined support room ${userRoom}`);
  }
  
  // Join admin support room if user is admin
  if (socket.user?.role === 'admin') {
    socket.join('support:admins');
    console.log(`Admin ${userId} joined admin support room`);
  }
  
  // Handle client message
  socket.on('client:message', async (data, callback) => {
    try {
      const { ticketId, content } = data;
      
      // Validate input
      if (!ticketId || !content) {
        return callback({ error: 'Missing required fields' });
      }
      
      // Find the ticket
      const ticket = await SupportTicket.findByPk(ticketId);
      
      if (!ticket) {
        return callback({ error: 'Ticket not found' });
      }
      
      // Check if user is authorized to send message to this ticket
      if (ticket.userId !== userId && socket.user?.role !== 'admin') {
        return callback({ error: 'Unauthorized' });
      }
      
      // Create the message
      const message = await SupportMessage.create({
        ticketId,
        senderId: userId,
        content,
        isInternal: false
      });
      
      // Update ticket last response time
      ticket.lastResponseAt = new Date();
      
      // If customer is responding to a resolved ticket, reopen it
      if (socket.user?.role !== 'admin' && ticket.status === 'resolved') {
        ticket.status = 'open';
      }
      
      // If admin is responding to an open ticket, mark it as in progress
      if (socket.user?.role === 'admin' && ticket.status === 'open') {
        ticket.status = 'in_progress';
        
        // If ticket isn't assigned to anyone, assign it to the responding admin
        if (!ticket.assignedTo) {
          ticket.assignedTo = userId;
        }
      }
      
      await ticket.save();
      
      // Get sender info
      const sender = await User.findByPk(userId, {
        attributes: ['id', 'fullName', 'role']
      });
      
      // Prepare message data
      const messageData = {
        id: message.id,
        ticketId,
        content,
        sender: {
          id: sender.id,
          fullName: sender.fullName,
          role: sender.role
        },
        createdAt: message.createdAt
      };
      
      // Emit to ticket room
      io.to(`support:ticket:${ticketId}`).emit('new:message', messageData);
      
      // Emit to user's room if they're not the sender
      if (ticket.userId !== userId) {
        io.to(`support:user:${ticket.userId}`).emit('new:message', messageData);
      }
      
      // Emit to assigned admin's room if they're not the sender
      if (ticket.assignedTo && ticket.assignedTo !== userId) {
        io.to(`support:user:${ticket.assignedTo}`).emit('new:message', messageData);
      }
      
      // Emit to all admins if no admin is assigned
      if (!ticket.assignedTo && socket.user?.role !== 'admin') {
        io.to('support:admins').emit('new:ticket:message', {
          ...messageData,
          ticket: {
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority
          }
        });
      }
      
      // Return success to the client
      callback({ success: true, message: messageData });
    } catch (error) {
      console.error('Error handling client message:', error);
      callback({ error: 'Failed to send message' });
    }
  });
  
  // Handle client typing status
  socket.on('client:typing', (data) => {
    const { ticketId, isTyping } = data;
    
    // Emit typing status to ticket room
    socket.to(`support:ticket:${ticketId}`).emit('user:typing', {
      ticketId,
      userId,
      isTyping
    });
  });
  
  // Join ticket room
  socket.on('join:ticket', async (ticketId) => {
    try {
      // Find the ticket
      const ticket = await SupportTicket.findByPk(ticketId);
      
      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found' });
        return;
      }
      
      // Check if user is authorized to join this ticket room
      if (ticket.userId !== userId && socket.user?.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      // Join the ticket room
      const ticketRoom = `support:ticket:${ticketId}`;
      socket.join(ticketRoom);
      console.log(`User ${userId} joined ticket room ${ticketRoom}`);
      
      // Mark messages as read if user is not the sender
      if (socket.user?.role === 'admin' && ticket.userId !== userId) {
        await SupportMessage.update(
          { readAt: new Date() },
          {
            where: {
              ticketId,
              senderId: ticket.userId,
              readAt: null
            }
          }
        );
      } else if (socket.user?.role !== 'admin') {
        await SupportMessage.update(
          { readAt: new Date() },
          {
            where: {
              ticketId,
              senderId: { $ne: userId },
              readAt: null,
              isInternal: false
            }
          }
        );
      }
      
      socket.emit('joined:ticket', { ticketId });
    } catch (error) {
      console.error('Error joining ticket room:', error);
      socket.emit('error', { message: 'Failed to join ticket room' });
    }
  });
  
  // Leave ticket room
  socket.on('leave:ticket', (ticketId) => {
    const ticketRoom = `support:ticket:${ticketId}`;
    socket.leave(ticketRoom);
    console.log(`User ${userId} left ticket room ${ticketRoom}`);
  });
  
  // Admin assigns ticket
  socket.on('admin:assign', async (data) => {
    try {
      const { ticketId, adminId } = data;
      
      // Check if user is admin
      if (socket.user?.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      // Find the ticket
      const ticket = await SupportTicket.findByPk(ticketId);
      
      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found' });
        return;
      }
      
      // Update ticket
      ticket.assignedTo = adminId;
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
      await ticket.save();
      
      // Get admin info
      const admin = await User.findByPk(adminId, {
        attributes: ['id', 'fullName']
      });
      
      // Emit to ticket room
      io.to(`support:ticket:${ticketId}`).emit('ticket:assigned', {
        ticketId,
        admin: {
          id: admin.id,
          fullName: admin.fullName
        }
      });
      
      // Emit to assigned admin's room
      io.to(`support:user:${adminId}`).emit('ticket:assigned:to:you', {
        ticketId,
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority
        }
      });
      
      // Emit to all admins
      io.to('support:admins').emit('ticket:updated', {
        ticketId,
        assignedTo: adminId,
        status: ticket.status
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      socket.emit('error', { message: 'Failed to assign ticket' });
    }
  });
  
  // Admin updates ticket status
  socket.on('admin:update:status', async (data) => {
    try {
      const { ticketId, status } = data;
      
      // Check if user is admin
      if (socket.user?.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      // Find the ticket
      const ticket = await SupportTicket.findByPk(ticketId);
      
      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found' });
        return;
      }
      
      // Update ticket
      ticket.status = status;
      
      // If status is closed, record closed time and admin
      if (status === 'closed') {
        ticket.closedAt = new Date();
        ticket.closedBy = userId;
      }
      
      await ticket.save();
      
      // Emit to ticket room
      io.to(`support:ticket:${ticketId}`).emit('ticket:status:updated', {
        ticketId,
        status,
        updatedBy: userId
      });
      
      // Emit to user's room
      io.to(`support:user:${ticket.userId}`).emit('ticket:status:updated', {
        ticketId,
        status,
        updatedBy: userId
      });
      
      // Emit to all admins
      io.to('support:admins').emit('ticket:updated', {
        ticketId,
        status
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      socket.emit('error', { message: 'Failed to update ticket status' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected from support`);
  });
}

// Utility function to notify admins about new support tickets
async function notifyAdminsAboutNewTicket(ticket, io) {
  try {
    // Get user info
    const user = await User.findByPk(ticket.userId, {
      attributes: ['id', 'fullName', 'email']
    });
    
    // Emit to all admins
    io.to('support:admins').emit('new:ticket', {
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt
      },
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error notifying admins about new ticket:', error);
  }
}

module.exports = {
  handleSupportEvents,
  notifyAdminsAboutNewTicket
};
