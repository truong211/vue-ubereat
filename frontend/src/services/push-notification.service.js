import { store } from '@/store'

class PushNotificationService {
  constructor() {
    this.publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    this.serviceWorkerRegistration = null
    this.subscription = null
    this.isInitialized = false
  }

  /**
   * Initialize push notification service
   */
  async init() {
    if (this.isInitialized) return
    
    try {
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported')
      }

      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
      
      // Check permission status
      const permission = await this.checkPermission()
      
      if (permission === 'granted') {
        await this.subscribeUser()
      }
      
      this.isInitialized = true
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage)
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      throw error
    }
  }

  /**
   * Check notification permission status
   * @returns {string} Permission status: 'granted', 'denied', or 'default'
   */
  async checkPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported')
    }
    return Notification.permission
  }

  /**
   * Request notification permission
   * @returns {string} Permission status
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        await this.subscribeUser()
        return 'granted'
      }
      
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser() {
    try {
      // Get active service worker registration
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready
      }

      // Get existing subscription
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()

      // Create new subscription if none exists
      if (!subscription) {
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
        })
      }

      // Save subscription to backend
      await this.saveSubscription(subscription)
      
      this.subscription = subscription
    } catch (error) {
      console.error('Failed to subscribe user:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Remove subscription from backend
        await this.removeSubscription(subscription)
        
        // Unsubscribe from push manager
        await subscription.unsubscribe()
        
        this.subscription = null
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      throw error
    }
  }

  /**
   * Save subscription to backend
   * @param {PushSubscription} subscription
   */
  async saveSubscription(subscription) {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.state.auth.token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      throw error
    }
  }

  /**
   * Remove subscription from backend
   * @param {PushSubscription} subscription
   */
  async removeSubscription(subscription) {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.state.auth.token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove subscription')
      }
    } catch (error) {
      console.error('Error removing subscription:', error)
      throw error
    }
  }

  /**
   * Handle messages from service worker
   * @param {MessageEvent} event
   */
  handleServiceWorkerMessage = (event) => {
    const { type, data } = event.data
    
    switch (type) {
      case 'NOTIFICATION_CLICKED':
        this.handleNotificationClick(data)
        break
        
      case 'NOTIFICATION_CLOSED':
        this.handleNotificationClose(data)
        break
        
      case 'PUSH_RECEIVED':
        this.handlePushReceived(data)
        break
    }
  }

  /**
   * Handle notification click events
   * @param {Object} data Notification data
   */
  handleNotificationClick(data) {
    // Handle notification clicks based on notification type
    switch (data.type) {
      case 'order_status':
        store.dispatch('orders/viewOrder', data.orderId)
        break
        
      case 'chat_message':
        store.dispatch('support/openChat', data.chatId)
        break
        
      case 'promotion':
        store.dispatch('promotions/viewPromotion', data.promotionId)
        break
    }
    
    // Track notification interaction
    store.dispatch('analytics/trackNotificationInteraction', {
      type: data.type,
      action: 'click',
      notificationId: data.id
    })
  }

  /**
   * Handle notification close events
   * @param {Object} data Notification data
   */
  handleNotificationClose(data) {
    // Track notification dismissed
    store.dispatch('analytics/trackNotificationInteraction', {
      type: data.type,
      action: 'dismiss',
      notificationId: data.id
    })
  }

  /**
   * Handle push messages received
   * @param {Object} data Push message data
   */
  handlePushReceived(data) {
    // Add notification to notification center
    store.dispatch('ui/addNotification', {
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      data: data.data
    })
    
    // Track notification received
    store.dispatch('analytics/trackNotificationInteraction', {
      type: data.type,
      action: 'receive',
      notificationId: data.id
    })
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   * @param {string} base64String Base64 encoded VAPID key
   * @returns {Uint8Array}
   */
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
}

export default new PushNotificationService()