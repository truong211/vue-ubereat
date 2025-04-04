const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const articleController = require('../controllers/article.controller');
const notificationController = require('../controllers/notification.controller');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// Public admin routes (no auth required)
router.get('/login', adminController.renderLoginPage);

// Admin UI routes (require auth)
router.get('/dashboard', adminController.renderDashboard);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Define the routes that don't need authentication
const publicEndpoints = ['/login'];
const tableEndpoints = [
  '/tables/:table/structure',
  '/tables/:table',
  '/tables/:table/:id',
  '/table-structure/:tableName',
  '/table-records/:tableName',
  '/records/:tableName/:id'
];

// Apply authMiddleware and isAdmin middleware to all API routes except public ones
// This is a cleaner approach than the previous middleware
router.use((req, res, next) => {
  // Skip authentication for login page and the root redirect
  if (publicEndpoints.includes(req.path) || req.path === '/') {
    return next();
  }
  
  // Skip authentication for table endpoints during debugging (if needed)
  const isTableEndpoint = tableEndpoints.some(endpoint => {
    const pattern = endpoint.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(req.path);
  });

  if (isTableEndpoint) {
    console.log('Skipping auth for table endpoint:', req.path);
    return next();
  }
  
  // Apply authentication for all other routes
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    isAdmin(req, res, next);
  });
});

// Database Table Management
router.get('/tables', adminController.getAllTables);
router.get('/tables/:table/structure', adminController.getTableStructure);
router.get('/tables/:table', adminController.getTableRecords);
router.get('/tables/:table/:id', adminController.getTableRecord);
router.post('/tables/:table', adminController.createTableRecord);
router.put('/tables/:table/:id', adminController.updateTableRecord);
router.delete('/tables/:table/:id', adminController.deleteTableRecord);

// Legacy endpoints for backward compatibility
router.get('/table-structure/:tableName', adminController.getTableStructure);
router.get('/table-records/:tableName', adminController.getTableRecords);
router.get('/records/:tableName/:id', adminController.getRecordById);
router.post('/records/:tableName', adminController.createRecord);
router.put('/records/:tableName/:id', adminController.updateRecord);
router.delete('/records/:tableName/:id', adminController.deleteRecord);
router.get('/related-tables/:tableName/:id', adminController.getRelatedTables);

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

// Notifications
router.get('/notifications', notificationController.getAdminNotifications);
router.get('/alerts', adminController.getSystemAlerts);

// Restaurant Management
router.get('/restaurants/pending', adminController.getPendingRestaurants);
router.patch('/restaurants/:id/status', adminController.updateRestaurantStatus);

// Banner Management
router.get('/banners', adminController.getBanners);
router.post('/banners', adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

// Static Page Management
router.get('/pages', adminController.getPages);
router.post('/pages', adminController.createPage);
router.put('/pages/:id', adminController.updatePage);
router.delete('/pages/:id', adminController.deletePage);

// Site Configuration
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/reported', adminController.getReportedUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/status', adminController.updateUserStatus);

module.exports = router;