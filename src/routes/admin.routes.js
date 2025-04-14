const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Apply middleware
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');

// Define public routes that don't require authentication
const publicRoutes = [
  '/login'
];

// Middleware to check if the route is public
router.use((req, res, next) => {
  // Skip authentication for public routes
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Apply authentication and admin check for all other routes
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    isAdmin(req, res, next);
  });
});

// Public routes
router.get('/login', (req, res) => {
  res.status(200).json({ message: 'Admin login page' });
});

// Dashboard and Analytics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// Database Table Management - These methods exist in the controller
router.get('/tables', adminController.getAllTables);
router.get('/table-structure/:tableName', adminController.getTableStructure);
router.get('/table-records/:tableName', adminController.getTableRecords);
router.get('/records/:tableName/:id', adminController.getRecordById);
router.post('/records/:tableName', adminController.createRecord);
router.put('/records/:tableName/:id', adminController.updateRecord);
router.delete('/records/:tableName/:id', adminController.deleteRecord);
router.get('/related-tables/:tableName/:id', adminController.getRelatedTables);

module.exports = router;