const express = require('express');
const router = express.Router();
const staffPermissionController = require('../controllers/staffPermission.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Routes require authentication and admin role
router.get('/', 
  protect, 
  restrictTo('admin'), 
  staffPermissionController.getAllStaffPermissions
);

router.get('/user/:userId', 
  protect, 
  staffPermissionController.getStaffPermissionByUserId
);

router.post('/', 
  protect, 
  restrictTo('admin'), 
  staffPermissionController.createStaffPermission
);

router.put('/:id', 
  protect, 
  restrictTo('admin'), 
  staffPermissionController.updateStaffPermission
);

router.delete('/:id', 
  protect, 
  restrictTo('admin'), 
  staffPermissionController.deleteStaffPermission
);

router.put('/:id/apply-group/:groupName', 
  protect, 
  restrictTo('admin'), 
  staffPermissionController.applyPermissionGroup
);

module.exports = router; 