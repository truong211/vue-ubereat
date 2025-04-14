const SupportTicket = require('../models/supportTicket.model');
const SupportMessage = require('../models/supportMessage.model');
const User = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const { emitToUser } = require('../socket/handlers');

/**
 * Get all support tickets with pagination and filtering
 * @route GET /api/support/tickets
 * @access Private (Admin only)
 */
exports.getAllTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const priority = req.query.priority;
    const category = req.query.category;
    const search = req.query.search || '';
    
    // Build query conditions
    const whereClause = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;
    
    // Get tickets with pagination
    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assignedAdmin',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: {
        tickets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single support ticket by ID
 * @route GET /api/support/tickets/:id
 * @access Private (Admin or ticket owner)
 */
exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ticket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: User,
          as: 'assignedAdmin',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: SupportMessage,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName', 'role']
            }
          ]
        }
      ]
    });
    
    if (!ticket) {
      return next(new AppError('Support ticket not found', 404));
    }
    
    // Check if user is authorized to view this ticket
    if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
      return next(new AppError('You are not authorized to view this ticket', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ticket
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new support ticket
 * @route POST /api/support/tickets
 * @access Private
 */
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority, orderId } = req.body;
    
    // Create the ticket
    const ticket = await SupportTicket.create({
      userId: req.user.id,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      orderId: orderId || null,
      status: 'open'
    });
    
    // Create initial message from the description
    await SupportMessage.create({
      ticketId: ticket.id,
      senderId: req.user.id,
      content: description
    });
    
    // Notify admins about new ticket
    // This would be implemented in the socket handlers
    
    res.status(201).json({
      status: 'success',
      data: {
        ticket
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a support ticket
 * @route PATCH /api/support/tickets/:id
 * @access Private (Admin only)
 */
exports.updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, category } = req.body;
    
    const ticket = await SupportTicket.findByPk(id);
    
    if (!ticket) {
      return next(new AppError('Support ticket not found', 404));
    }
    
    // Update ticket fields
    if (status) {
      ticket.status = status;
      
      // If status is being set to closed, record the time and user
      if (status === 'closed' && ticket.status !== 'closed') {
        ticket.closedAt = new Date();
        ticket.closedBy = req.user.id;
      }
    }
    
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;
    if (assignedTo) ticket.assignedTo = assignedTo;
    
    await ticket.save();
    
    // If status changed, notify the user
    if (status && status !== ticket.status) {
      emitToUser(ticket.userId, 'ticket_status_updated', {
        ticketId: ticket.id,
        status: ticket.status
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ticket
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a message to a support ticket
 * @route POST /api/support/tickets/:id/messages
 * @access Private (Admin or ticket owner)
 */
exports.addMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, isInternal = false, attachments = [] } = req.body;
    
    const ticket = await SupportTicket.findByPk(id);
    
    if (!ticket) {
      return next(new AppError('Support ticket not found', 404));
    }
    
    // Check if user is authorized to add message to this ticket
    if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
      return next(new AppError('You are not authorized to add messages to this ticket', 403));
    }
    
    // Only admins can add internal notes
    if (isInternal && req.user.role !== 'admin') {
      return next(new AppError('Only admins can add internal notes', 403));
    }
    
    // Create the message
    const message = await SupportMessage.create({
      ticketId: id,
      senderId: req.user.id,
      content,
      isInternal,
      attachments
    });
    
    // Update the ticket's last response time
    ticket.lastResponseAt = new Date();
    
    // If customer is responding to a resolved ticket, reopen it
    if (req.user.role !== 'admin' && ticket.status === 'resolved') {
      ticket.status = 'open';
    }
    
    // If admin is responding to an open ticket, mark it as in progress
    if (req.user.role === 'admin' && ticket.status === 'open') {
      ticket.status = 'in_progress';
      
      // If ticket isn't assigned to anyone, assign it to the responding admin
      if (!ticket.assignedTo) {
        ticket.assignedTo = req.user.id;
      }
    }
    
    await ticket.save();
    
    // Notify the other party about the new message
    const recipientId = req.user.role === 'admin' ? ticket.userId : ticket.assignedTo;
    if (recipientId && !isInternal) {
      emitToUser(recipientId, 'new_support_message', {
        ticketId: id,
        message: {
          id: message.id,
          content,
          senderId: req.user.id,
          senderName: req.user.fullName,
          createdAt: message.createdAt
        }
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all messages for a ticket
 * @route GET /api/support/tickets/:id/messages
 * @access Private (Admin or ticket owner)
 */
exports.getTicketMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ticket = await SupportTicket.findByPk(id);
    
    if (!ticket) {
      return next(new AppError('Support ticket not found', 404));
    }
    
    // Check if user is authorized to view this ticket's messages
    if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
      return next(new AppError('You are not authorized to view messages for this ticket', 403));
    }
    
    // Get messages
    const messages = await SupportMessage.findAll({
      where: {
        ticketId: id,
        // If not admin, exclude internal messages
        ...(req.user.role !== 'admin' && { isInternal: false })
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'role']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tickets for the current user
 * @route GET /api/support/my-tickets
 * @access Private
 */
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tickets assigned to the current admin
 * @route GET /api/support/assigned-tickets
 * @access Private (Admin only)
 */
exports.getAssignedTickets = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can access assigned tickets', 403));
    }
    
    const tickets = await SupportTicket.findAll({
      where: { assignedTo: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get support ticket statistics
 * @route GET /api/support/stats
 * @access Private (Admin only)
 */
exports.getTicketStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can access ticket statistics', 403));
    }
    
    // Get counts by status
    const openCount = await SupportTicket.count({ where: { status: 'open' } });
    const inProgressCount = await SupportTicket.count({ where: { status: 'in_progress' } });
    const resolvedCount = await SupportTicket.count({ where: { status: 'resolved' } });
    const closedCount = await SupportTicket.count({ where: { status: 'closed' } });
    
    // Get counts by priority
    const urgentCount = await SupportTicket.count({ where: { priority: 'urgent' } });
    const highCount = await SupportTicket.count({ where: { priority: 'high' } });
    const mediumCount = await SupportTicket.count({ where: { priority: 'medium' } });
    const lowCount = await SupportTicket.count({ where: { priority: 'low' } });
    
    // Get counts by category
    const accountCount = await SupportTicket.count({ where: { category: 'account' } });
    const orderCount = await SupportTicket.count({ where: { category: 'order' } });
    const paymentCount = await SupportTicket.count({ where: { category: 'payment' } });
    const deliveryCount = await SupportTicket.count({ where: { category: 'delivery' } });
    const restaurantCount = await SupportTicket.count({ where: { category: 'restaurant' } });
    const appCount = await SupportTicket.count({ where: { category: 'app' } });
    const otherCount = await SupportTicket.count({ where: { category: 'other' } });
    
    // Get unassigned tickets count
    const unassignedCount = await SupportTicket.count({
      where: {
        assignedTo: null,
        status: ['open', 'in_progress']
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        statusCounts: {
          open: openCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          closed: closedCount
        },
        priorityCounts: {
          urgent: urgentCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount
        },
        categoryCounts: {
          account: accountCount,
          order: orderCount,
          payment: paymentCount,
          delivery: deliveryCount,
          restaurant: restaurantCount,
          app: appCount,
          other: otherCount
        },
        unassigned: unassignedCount,
        total: openCount + inProgressCount + resolvedCount + closedCount
      }
    });
  } catch (error) {
    next(error);
  }
};
