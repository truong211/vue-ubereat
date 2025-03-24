const { StaffPermission, User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all staff permissions
 * @route GET /api/staff-permissions
 * @access Admin
 */
exports.getAllStaffPermissions = asyncHandler(async (req, res) => {
  const staffPermissions = await StaffPermission.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'email', 'role']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: staffPermissions
  });
});

/**
 * Get staff permission by user id
 * @route GET /api/staff-permissions/user/:userId
 * @access Admin, Self
 */
exports.getStaffPermissionByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const staffPermission = await StaffPermission.findOne({
    where: { userId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'email', 'role']
      }
    ]
  });
  
  if (!staffPermission) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }
  
  res.status(200).json({
    success: true,
    data: staffPermission
  });
});

/**
 * Create staff permission
 * @route POST /api/staff-permissions
 * @access Admin
 */
exports.createStaffPermission = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Check if permission already exists
  const existingPermission = await StaffPermission.findOne({ where: { userId } });
  if (existingPermission) {
    throw new ApiError(400, 'Permission for this user already exists');
  }
  
  // Create permission with default values based on role
  let permissionData = {
    userId,
    permissionGroup: 'basic'
  };
  
  // Set default permissions based on user role
  if (user.role === 'admin') {
    permissionData.permissionGroup = 'admin';
    permissionData.canManageOrders = true;
    permissionData.canCancelOrders = true;
    permissionData.canAssignDrivers = true;
    permissionData.canManageDeliveries = true;
    permissionData.canManageUsers = true;
    permissionData.canManageSettings = true;
  } else if (user.role === 'restaurant') {
    permissionData.permissionGroup = 'manager';
    permissionData.canManageOrders = true;
    permissionData.canManageMenu = true;
    permissionData.canManageRestaurantSettings = true;
  } else if (user.role === 'driver') {
    permissionData.canViewDeliveries = true;
    permissionData.canManageDeliveries = true;
  }
  
  // Create the permission with the prepared data
  const staffPermission = await StaffPermission.create({
    ...req.body,
    ...permissionData
  });
  
  res.status(201).json({
    success: true,
    data: staffPermission
  });
});

/**
 * Update staff permission
 * @route PUT /api/staff-permissions/:id
 * @access Admin
 */
exports.updateStaffPermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const staffPermission = await StaffPermission.findByPk(id);
  if (!staffPermission) {
    throw new ApiError(404, 'Staff permission not found');
  }
  
  // Update the permission
  await staffPermission.update(req.body);
  
  // Fetch the updated permission with user data
  const updatedPermission = await StaffPermission.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'email', 'role']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: updatedPermission
  });
});

/**
 * Delete staff permission
 * @route DELETE /api/staff-permissions/:id
 * @access Admin
 */
exports.deleteStaffPermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const staffPermission = await StaffPermission.findByPk(id);
  if (!staffPermission) {
    throw new ApiError(404, 'Staff permission not found');
  }
  
  await staffPermission.destroy();
  
  res.status(200).json({
    success: true,
    message: 'Staff permission deleted successfully'
  });
});

/**
 * Apply permission group template
 * @route PUT /api/staff-permissions/:id/apply-group/:groupName
 * @access Admin
 */
exports.applyPermissionGroup = asyncHandler(async (req, res) => {
  const { id, groupName } = req.params;
  
  const staffPermission = await StaffPermission.findByPk(id);
  if (!staffPermission) {
    throw new ApiError(404, 'Staff permission not found');
  }
  
  // Define permission templates
  const permissionTemplates = {
    basic: {
      permissionGroup: 'basic',
      canViewOrders: true,
      canManageOrders: false,
      canCancelOrders: false,
      canAssignDrivers: false,
      canViewDeliveries: true,
      canManageDeliveries: false,
      canManageMenu: false,
      canManageRestaurantSettings: false,
      canManageUsers: false,
      canManageSettings: false
    },
    standard: {
      permissionGroup: 'standard',
      canViewOrders: true,
      canManageOrders: true,
      canCancelOrders: false,
      canAssignDrivers: false,
      canViewDeliveries: true,
      canManageDeliveries: false,
      canManageMenu: false,
      canManageRestaurantSettings: false,
      canManageUsers: false,
      canManageSettings: false
    },
    manager: {
      permissionGroup: 'manager',
      canViewOrders: true,
      canManageOrders: true,
      canCancelOrders: true,
      canAssignDrivers: true,
      canViewDeliveries: true,
      canManageDeliveries: true,
      canManageMenu: true,
      canManageRestaurantSettings: true,
      canManageUsers: false,
      canManageSettings: false
    },
    admin: {
      permissionGroup: 'admin',
      canViewOrders: true,
      canManageOrders: true,
      canCancelOrders: true,
      canAssignDrivers: true,
      canViewDeliveries: true,
      canManageDeliveries: true,
      canManageMenu: true,
      canManageRestaurantSettings: true,
      canManageUsers: true,
      canManageSettings: true
    }
  };
  
  // Check if the requested template exists
  if (!permissionTemplates[groupName]) {
    throw new ApiError(400, 'Invalid permission group');
  }
  
  // Apply the template
  await staffPermission.update(permissionTemplates[groupName]);
  
  // Fetch the updated permission with user data
  const updatedPermission = await StaffPermission.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'email', 'role']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: updatedPermission
  });
}); 