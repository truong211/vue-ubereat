const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(verifyToken, isAdmin);

// Dashboard routes
router.get('/dashboard/stats', adminController.getDashboardStats);

// Database tables CRUD operations
router.get('/tables', adminController.getAllTables);
router.get('/table-structure/:tableName', adminController.getTableStructure);
router.get('/related-tables/:tableName/:id', adminController.getRelatedTables);

// Generic CRUD for all tables
router.get('/:tableName', adminController.getTableRecords);
router.post('/:tableName', adminController.createRecord);
router.get('/:tableName/:id', adminController.getRecordById);
router.put('/:tableName/:id', adminController.updateRecord);
router.delete('/:tableName/:id', adminController.deleteRecord);

module.exports = router; 