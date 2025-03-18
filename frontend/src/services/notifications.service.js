import { apiClient } from './api.service';

class NotificationService {
  /**
   * Register the device for push notifications
   * @param {string} token - FCM or other push notification token
   * @returns {Promise} Response from the API
   */
  async registerDevice(token) {
    return apiClient.post('/notifications/devices', { token });
  }

  /**
   * Unregister the device from push notifications
   * @param {string} token - FCM or other push notification token
   * @returns {Promise} Response from the API
   */
  async unregisterDevice(token) {
    return apiClient.delete(`/notifications/devices/${token}`);
  }
  
  /**
   * Update notification preferences
   * @param {Object} preferences - User's notification preferences
   * @returns {Promise} Response from the API
   */
  async updatePreferences(preferences) {
    return apiClient.put('/notifications/preferences', preferences);
  }
  
  /**
   * Get notification preferences
   * @returns {Promise} Response from the API containing user's notification preferences
   */
  async getPreferences() {
    return apiClient.get('/notifications/preferences');
  }
  
  /**
   * Get user notifications
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise} Response from the API containing user's notifications
   */
  async getNotifications(params = {}) {
    return apiClient.get('/notifications', { params });
  }
  
  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @returns {Promise} Response from the API
   */
  async markAsRead(id) {
    return apiClient.put(`/notifications/${id}/read`);
  }
  
  /**
   * Mark all notifications as read
   * @returns {Promise} Response from the API
   */
  async markAllAsRead() {
    return apiClient.put('/notifications/read-all');
  }
  
  /**
   * Delete notification
   * @param {string} id - Notification ID
   * @returns {Promise} Response from the API
   */
  async deleteNotification(id) {
    return apiClient.delete(`/notifications/${id}`);
  }
}

export const notificationService = new NotificationService();