const express = require('express');
const router = express.Router();
const groceryController = require('../controllers/grocery.controller');
const { authMiddleware, restrictTo } = require('../middleware/auth.middleware');

// Public routes
router.get('/groceries', groceryController.getAllGroceries);
router.get('/groceries/categories', groceryController.getCategories);
router.get('/groceries/:id', groceryController.getGroceryById);

// Protected routes (admin only)
router.post('/groceries', authMiddleware, restrictTo('admin'), groceryController.createGrocery);
router.patch('/groceries/:id', authMiddleware, restrictTo('admin'), groceryController.updateGrocery);
router.delete('/groceries/:id', authMiddleware, restrictTo('admin'), groceryController.deleteGrocery);

module.exports = router;