const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const addressController = require('../controllers/address.controller');
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// User Profile Routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/profile/avatar', protect, upload.single('avatar'), userController.uploadAvatar);
router.delete('/profile/avatar', protect, userController.removeAvatar);

// Address Management Routes
router.get('/addresses', protect, addressController.getUserAddresses);
router.post('/addresses', protect, addressController.createAddress);
router.get('/addresses/:id', protect, addressController.getAddress);
router.put('/addresses/:id', protect, addressController.updateAddress);
router.delete('/addresses/:id', protect, addressController.deleteAddress);
router.patch('/addresses/:id/default', protect, addressController.setDefaultAddress);

// Order History Routes
router.get('/orders', protect, orderController.getUserOrders);
router.get('/orders/:id', protect, orderController.getOrder);
router.get('/orders/statistics/summary', protect, orderController.getOrderStatistics);

module.exports = router;