const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Apply middleware
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');
router.use(authMiddleware);
router.use(isAdmin);

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