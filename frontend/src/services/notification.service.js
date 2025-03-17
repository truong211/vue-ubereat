import socketService from './socket.service'
import { useNotification } from '@kyvg/vue3-notification'
import axios from 'axios';
import { store } from '@/store';

class NotificationService {
  constructor() {
    this.notification = useNotification()
    this.statusMessages = {
      pending: 'Đơn hàng đang chờ xác nhận',
      accepted: 'Nhà hàng đã xác nhận đơn hàng',
      preparing: 'Nhà hàng đang chuẩn bị món ăn',
      picked_up: 'Tài xế đã lấy đơn hàng',
      on_the_way: 'Tài xế đang trên đường giao hàng',
      delivered: 'Đơn hàng đã được giao thành công',
      cancelled: 'Đơn hàng đã bị hủy'
    }
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    this.swRegistration = null;
    this.isSubscribed = false;
  }

  init() {
    // Listen for order status changes
    socketService.onOrderStatus(this.handleStatusUpdate.bind(this))
    
    // Listen for ETA updates
    socketService.onETAUpdate(this.handleETAUpdate.bind(this))
    
    // Listen for new driver messages
    socketService.onNewMessage(this.handleNewMessage.bind(this))
  }

  async initialize() {
    try {
      // Check if service workers and push messaging are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported in this browser');
        return false;
      }
      
      // Register the service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully', this.swRegistration);
      
      // Check if already subscribed
      this.isSubscribed = await this.checkSubscription();
      
      return true;
    } catch (error) {
      console.error('Error initializing notification service', error);
      return false;
    }
  }

  async checkSubscription() {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      const isSubscribed = !!subscription;
      store.commit('notifications/SET_SUBSCRIPTION_STATUS', isSubscribed);
      return isSubscribed;
    } catch (error) {
      console.error('Error checking subscription', error);
      return false;
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission', error);
      return false;
    }
  }

  async subscribe() {
    try {
      // Request permission first
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        return false;
      }
      
      // Convert VAPID key from base64 to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      
      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      console.log('User is subscribed to push notifications', subscription);
      
      // Save subscription to server
      await this.saveSubscriptionToServer(subscription);
      
      // Update subscription status
      this.isSubscribed = true;
      store.commit('notifications/SET_SUBSCRIPTION_STATUS', true);
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications', error);
      return false;
    }
  }

  async unsubscribe() {
    try {
      // Get subscription
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        return true; // Already unsubscribed
      }
      
      // Unsubscribe from push manager
      await subscription.unsubscribe();
      
      // Delete subscription from server
      await this.deleteSubscriptionFromServer(subscription);
      
      // Update subscription status
      this.isSubscribed = false;
      store.commit('notifications/SET_SUBSCRIPTION_STATUS', false);
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications', error);
      return false;
    }
  }

  async saveSubscriptionToServer(subscription) {
    try {
      const response = await axios.post('/api/notifications/subscribe', {
        subscription: subscription.toJSON(),
        userPreferences: store.state.notifications.preferences
      });
      return response.data;
    } catch (error) {
      console.error('Error saving subscription to server', error);
      throw error;
    }
  }

  async deleteSubscriptionFromServer(subscription) {
    try {
      const response = await axios.post('/api/notifications/unsubscribe', {
        subscription: subscription.toJSON()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting subscription from server', error);
      throw error;
    }
  }

  async updatePreferences(preferences) {
    try {
      // Update preferences locally
      store.commit('notifications/SET_PREFERENCES', preferences);
      
      // Check if subscribed
      if (!this.isSubscribed) {
        return true;
      }
      
      // Get current subscription
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        return true;
      }
      
      // Update preferences on server
      const response = await axios.put('/api/notifications/preferences', {
        subscription: subscription.toJSON(),
        preferences
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences', error);
      throw error;
    }
  }

  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await axios.get(`/api/notifications?page=${page}&limit=${limit}`);
      store.commit('notifications/SET_NOTIFICATIONS', response.data.notifications);
      return response.data;
    } catch (error) {
      console.error('Error getting notifications', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`/api/notifications/read/${notificationId}`);
      store.commit('notifications/MARK_AS_READ', notificationId);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await axios.put('/api/notifications/read-all');
      store.commit('notifications/MARK_ALL_AS_READ');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read', error);
      throw error;
    }
  }

  async getNotificationCounts() {
    try {
      const response = await axios.get('/api/notifications/counts');
      store.commit('notifications/SET_NOTIFICATION_COUNTS', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting notification counts', error);
      throw error;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  handleStatusUpdate(data) {
    const { status, orderId } = data
    if (this.statusMessages[status]) {
      this.showNotification({
        title: 'Cập nhật trạng thái đơn hàng',
        text: this.statusMessages[status],
        type: this.getNotificationType(status),
        duration: 5000,
        data: { orderId, type: 'status_update' }
      })
    }
  }

  handleETAUpdate(data) {
    const { eta, orderId } = data
    const etaTime = new Date(eta).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    this.showNotification({
      title: 'Cập nhật thời gian giao hàng',
      text: `Thời gian giao hàng dự kiến: ${etaTime}`,
      type: 'info',
      duration: 5000,
      data: { orderId, type: 'eta_update' }
    })
  }

  handleNewMessage(message) {
    if (message.from === 'driver') {
      this.showNotification({
        title: 'Tin nhắn mới từ tài xế',
        text: message.text,
        type: 'info',
        duration: 5000,
        data: { orderId: message.orderId, type: 'new_message' }
      })
    }
  }

  getNotificationType(status) {
    switch (status) {
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'accepted':
      case 'picked_up':
        return 'success'
      default:
        return 'info'
    }
  }

  showNotification(options) {
    this.notification.notify({
      ...options,
      group: 'order-updates'
    })
  }
}

export const notificationService = new NotificationService();
export default notificationService;
