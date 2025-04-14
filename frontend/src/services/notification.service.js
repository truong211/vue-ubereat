import socketService from './socket.service'
import { useNotification } from '@kyvg/vue3-notification'
import { apiClient } from './api.service'
import { store } from '@/store'

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
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    this.swRegistration = null
    this.isSubscribed = false
  }

  init() {
    // Listen for order status changes
    socketService.onOrderStatus(this.handleStatusUpdate.bind(this))
    
    // Listen for ETA updates
    socketService.onETAUpdate(this.handleETAUpdate.bind(this))
    
    // Listen for new driver messages
    socketService.onNewMessage(this.handleNewMessage.bind(this))
  }

  // Push Notification Methods
  async initialize() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported in this browser')
        return false
      }
      
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully', this.swRegistration)
      
      this.isSubscribed = await this.checkSubscription()
      return true
    } catch (error) {
      console.error('Error initializing notification service', error)
      return false
    }
  }

  async checkSubscription() {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      const isSubscribed = !!subscription
      store.commit('notifications/SET_SUBSCRIPTION_STATUS', isSubscribed)
      return isSubscribed
    } catch (error) {
      console.error('Error checking subscription', error)
      return false
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission', error)
      return false
    }
  }

  // Device Registration Methods
  async registerDevice(token) {
    return apiClient.post('/api/notifications/devices', { token })
  }

  async unregisterDevice(token) {
    return apiClient.delete(`/api/notifications/devices/${token}`)
  }

  // Subscription Methods
  async subscribe() {
    try {
      const permissionGranted = await this.requestPermission()
      if (!permissionGranted) return false
      
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey)
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
      
      await this.saveSubscriptionToServer(subscription)
      
      this.isSubscribed = true
      store.commit('notifications/SET_SUBSCRIPTION_STATUS', true)
      return true
    } catch (error) {
      console.error('Error subscribing to push notifications', error)
      return false
    }
  }

  async unsubscribe() {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (!subscription) return true
      
      await subscription.unsubscribe()
      await this.deleteSubscriptionFromServer(subscription)
      
      this.isSubscribed = false
      store.commit('notifications/SET_SUBSCRIPTION_STATUS', false)
      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications', error)
      return false
    }
  }

  // Server Communication Methods
  async saveSubscriptionToServer(subscription) {
    return apiClient.post('/api/notifications/subscribe', {
      subscription: subscription.toJSON(),
      userPreferences: store.state.notifications.preferences
    })
  }

  async deleteSubscriptionFromServer(subscription) {
    return apiClient.post('/api/notifications/unsubscribe', {
      subscription: subscription.toJSON()
    })
  }

  // Notification CRUD Methods
  async getNotifications(params = {}) {
    return apiClient.get('/api/notifications', { params })
  }

  async markAsRead(id) {
    const response = await apiClient.put(`/api/notifications/${id}/read`)
    store.commit('notifications/MARK_AS_READ', id)
    return response
  }

  async markAllAsRead() {
    const response = await apiClient.put('/api/notifications/read-all')
    store.commit('notifications/MARK_ALL_AS_READ')
    return response
  }

  async deleteNotification(id) {
    return apiClient.delete(`/api/notifications/${id}`)
  }

  // Preferences Methods
  async getPreferences() {
    return apiClient.get('/api/notifications/preferences')
  }

  async updatePreferences(preferences) {
    try {
      store.commit('notifications/SET_PREFERENCES', preferences)
      
      if (!this.isSubscribed) return true
      
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (!subscription) return true
      
      return apiClient.put('/api/notifications/preferences', {
        subscription: subscription.toJSON(),
        preferences
      })
    } catch (error) {
      console.error('Error updating notification preferences', error)
      throw error
    }
  }

  // Utility Methods
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Event Handlers
  handleStatusUpdate(data) {
    const { orderId, status } = data
    const message = this.statusMessages[status] || 'Trạng thái đơn hàng đã được cập nhật'
    
    this.showNotification({
      title: 'Cập nhật trạng thái đơn hàng',
      text: message,
      type: this.getNotificationType(status)
    })
  }

  handleETAUpdate(data) {
    const { orderId, eta } = data
    const etaDate = new Date(eta)
    const formattedETA = etaDate.toLocaleTimeString()
    
    this.showNotification({
      title: 'Cập nhật thời gian giao hàng',
      text: `Đơn hàng của bạn dự kiến sẽ được giao lúc ${formattedETA}`,
      type: 'info'
    })
  }

  handleNewMessage(message) {
    this.showNotification({
      title: 'Tin nhắn mới từ tài xế',
      text: message.content,
      type: 'info'
    })
  }

  getNotificationType(status) {
    switch (status) {
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'accepted':
      case 'preparing':
      case 'picked_up':
      case 'on_the_way':
        return 'info'
      default:
        return 'default'
    }
  }

  showNotification(options) {
    this.notification.notify({
      ...options,
      duration: 5000,
      speed: 1000
    })
  }
}

export const notificationService = new NotificationService()
