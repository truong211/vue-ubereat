const express = require('express');
const router = express.Router();
const staffPermissionController = require('../controllers/staffPermission.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Routes require authentication and admin role
router.get('/', 
  authenticate, 
  authorize('admin'), 
  staffPermissionController.getAllStaffPermissions
);

router.get('/user/:userId', 
  authenticate, 
  staffPermissionController.getStaffPermissionByUserId
);

router.post('/', 
  authenticate, 
  authorize('admin'), 
  staffPermissionController.createStaffPermission
);

router.put('/:id', 
  authenticate, 
  authorize('admin'), 
  staffPermissionController.updateStaffPermission
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'), 
  staffPermissionController.deleteStaffPermission
);

router.put('/:id/apply-group/:groupName', 
  authenticate, 
  authorize('admin'), 
  staffPermissionController.applyPermissionGroup
);

module.exports = router; 