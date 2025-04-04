const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');

// Add middleware to validate table name parameter
const validateTableName = (req, res, next) => {
  const tableName = req.params.table || req.params.tableName;
  
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid or missing table name. Please specify a valid table name.'
    });
  }
  
  next();
};

// Public admin routes (no auth required)
router.get('/login', adminController.renderLoginPage);

// Admin UI routes (require auth)
router.get('/dashboard', adminController.renderDashboard);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Define the routes that don't need authentication
const publicEndpoints = ['/login'];

// Apply authMiddleware and isAdmin middleware to all API routes except public ones
router.use((req, res, next) => {
  // Skip authentication for login page and the root redirect
  if (publicEndpoints.includes(req.path) || req.path === '/') {
    return next();
  }
  
  // Skip authentication for debugging (if needed)
  // In production, you should enforce authentication for all table endpoints
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/tables/')) {
    console.log('Skipping auth for table endpoint in development mode:', req.path);
    return next();
  }
  
  // Apply authentication for all other routes
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    isAdmin(req, res, next);
  });
});

// Database Table Management with table name validation
router.get('/tables', adminController.getAllTables);
router.get('/tables/:table/structure', validateTableName, adminController.getTableStructure);
router.get('/tables/:table', validateTableName, adminController.getTableRecords);
router.get('/tables/:table/:id', validateTableName, adminController.getTableRecord);
router.post('/tables/:table', validateTableName, adminController.createTableRecord);
router.put('/tables/:table/:id', validateTableName, adminController.updateTableRecord);
router.delete('/tables/:table/:id', validateTableName, adminController.deleteTableRecord);

// Legacy endpoints for backward compatibility (also with validation)
router.get('/table-structure/:tableName', validateTableName, adminController.getTableStructure);
router.get('/table-records/:tableName', validateTableName, adminController.getTableRecords);
router.get('/records/:tableName/:id', validateTableName, adminController.getRecordById);
router.post('/records/:tableName', validateTableName, adminController.createRecord);
router.put('/records/:tableName/:id', validateTableName, adminController.updateRecord);
router.delete('/records/:tableName/:id', validateTableName, adminController.deleteRecord);
router.get('/related-tables/:tableName/:id', validateTableName, adminController.getRelatedTables);

// Add a diagnostic route
router.get('/check-auth', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Admin authentication successful',
    user: req.user ? {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    } : 'Not authenticated'
  });
});

// Dashboard and Analytics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/recent-activities', adminController.getRecentActivities);

// Other routes remain the same...

module.exports = router; 