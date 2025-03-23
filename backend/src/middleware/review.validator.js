const { body, validationResult } = require('express-validator');
const { Order, Restaurant, OrderItem } = require('../models');

const validateCreateReview = [
  body('restaurantId')
    .optional()
    .isInt()
    .withMessage('ID nhà hàng không hợp lệ'),
  body('orderId')
    .not()
    .isEmpty()
    .isInt()
    .withMessage('ID đơn hàng không được để trống'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Đánh giá phải từ 1 đến 5 sao'),
  body('comment')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Nhận xét phải từ 10 đến 500 ký tự'),
];

const validateUpdateReview = [
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Đánh giá phải từ 1 đến 5 sao'),
  body('comment')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Nhận xét phải từ 10 đến 500 ký tự'),
];

const validateReportReview = [
  body('reason')
    .isString()
    .notEmpty()
    .withMessage('Vui lòng chọn lý do báo cáo'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
];

const validateRestaurantResponse = [
  body('response')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Phản hồi phải từ 10 đến 1000 ký tự'),
];

exports.validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Đánh giá phải từ 1 đến 5 sao'),
  body('comment')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Nội dung đánh giá phải từ 10 đến 2000 ký tự'),
  body('orderItemIds')
    .optional()
    .isArray()
    .withMessage('Danh sách món ăn không hợp lệ'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Định dạng ảnh không hợp lệ'),

  // Custom validation middleware
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { restaurantId, orderId, orderItemIds } = req.body;
      const userId = req.user.id;

      // Verify the order exists and belongs to the user
      const order = await Order.findOne({
        where: {
          id: orderId,
          userId,
          status: 'completed'
        }
      });

      if (!order) {
        return res.status(400).json({
          success: false,
          message: 'Bạn chỉ có thể đánh giá đơn hàng đã hoàn thành'
        });
      }

      // Verify the restaurant exists and matches the order
      const restaurant = await Restaurant.findOne({
        where: {
          id: restaurantId,
          isActive: true
        }
      });

      if (!restaurant || order.restaurantId !== restaurantId) {
        return res.status(400).json({
          success: false,
          message: 'Nhà hàng không tồn tại hoặc đã ngừng hoạt động'
        });
      }

      // If specific items are being reviewed, verify they belong to the order
      if (orderItemIds?.length > 0) {
        const orderItems = await OrderItem.findAll({
          where: {
            id: orderItemIds,
            orderId
          }
        });

        if (orderItems.length !== orderItemIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Một hoặc nhiều món ăn không hợp lệ'
          });
        }
      }

      // Check if review already exists for this order
      const existingReview = await Review.findOne({
        where: { orderId, userId }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đánh giá đơn hàng này rồi'
        });
      }

      // Validate image count
      if (req.files?.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Tối đa 5 ảnh cho mỗi đánh giá'
        });
      }

      // Validate image types and sizes
      if (req.files?.length) {
        const invalidFiles = req.files.filter(file => {
          const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
          const maxSize = 5 * 1024 * 1024; // 5MB
          return !validTypes.includes(file.mimetype) || file.size > maxSize;
        });

        if (invalidFiles.length) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng hoặc kích thước ảnh không hợp lệ. Chỉ chấp nhận các tệp JPG, PNG, hoặc WebP dưới 5MB'
          });
        }
      }

      // Check for profanity or inappropriate content
      const profanityFilter = new ProfanityFilter();
      if (profanityFilter.isProfane(req.body.comment)) {
        return res.status(400).json({
          success: false,
          message: 'Đánh giá chứa ngôn ngữ không phù hợp'
        });
      }

      // All validations passed
      next();
    } catch (error) {
      console.error('Review validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xác thực đánh giá'
      });
    }
  }
];

module.exports = {
  validateCreateReview,
  validateUpdateReview,
  validateReportReview,
  validateRestaurantResponse,
  validateReview,
};