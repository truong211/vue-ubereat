const { Notification, User, Review, Restaurant } = require('../models');

class NotificationService {
  static async createReviewResponseNotification(review, response) {
    const restaurant = await Restaurant.findByPk(review.restaurantId);
    
    return Notification.create({
      userId: review.userId,
      title: 'Phản hồi từ nhà hàng',
      message: `${restaurant.name} đã phản hồi đánh giá của bạn`,
      type: 'review_response',
      data: {
        reviewId: review.id,
        restaurantId: restaurant.id,
        response: response
      },
      isRead: false
    });
  }

  static async createReviewModerationNotification(review, status, reason) {
    return Notification.create({
      userId: review.userId,
      title: 'Cập nhật đánh giá',
      message: status === 'approved' 
        ? 'Đánh giá của bạn đã được phê duyệt'
        : 'Đánh giá của bạn đã bị từ chối',
      type: 'review_moderation',
      data: {
        reviewId: review.id,
        status: status,
        reason: reason
      },
      isRead: false
    });
  }

  static async createNewReviewNotification(review) {
    const restaurant = await Restaurant.findByPk(review.restaurantId, {
      include: [{ model: User, as: 'owner' }]
    });

    if (restaurant?.owner) {
      return Notification.create({
        userId: restaurant.owner.id,
        title: 'Đánh giá mới',
        message: `Nhà hàng của bạn vừa nhận được đánh giá ${review.rating} sao`,
        type: 'new_review',
        data: {
          reviewId: review.id,
          restaurantId: restaurant.id,
          rating: review.rating
        },
        isRead: false
      });
    }
  }

  static async createReviewReportNotification(report) {
    // Notify moderators about new review reports
    const moderators = await User.findAll({
      where: {
        role: ['admin', 'moderator']
      }
    });

    const notifications = moderators.map(moderator => ({
      userId: moderator.id,
      title: 'Báo cáo đánh giá mới',
      message: 'Có đánh giá mới bị báo cáo cần xem xét',
      type: 'review_report',
      data: {
        reportId: report.id,
        reviewId: report.reviewId,
        reason: report.reason
      },
      isRead: false
    }));

    return Notification.bulkCreate(notifications);
  }
}

module.exports = NotificationService;