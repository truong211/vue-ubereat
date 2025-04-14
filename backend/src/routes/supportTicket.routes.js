const express = require('express');
const router = express.Router();
const supportTicketController = require('../controllers/supportTicket.controller');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes for all authenticated users
router.get('/my-tickets', supportTicketController.getMyTickets);
router.post('/', supportTicketController.createTicket);
router.get('/:id', supportTicketController.getTicketById);
router.get('/:id/messages', supportTicketController.getTicketMessages);
router.post('/:id/messages', supportTicketController.addMessage);

// Admin-only routes
router.get('/', isAdmin, supportTicketController.getAllTickets);
router.get('/stats', isAdmin, supportTicketController.getTicketStats);
router.get('/assigned', isAdmin, supportTicketController.getAssignedTickets);
router.patch('/:id', isAdmin, supportTicketController.updateTicket);

module.exports = router;
