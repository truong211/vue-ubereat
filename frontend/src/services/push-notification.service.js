import { ref } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';

/**
 * Push Notification Service
 * Handles browser push notifications using the Web Push API
 */

class PushNotificationService {
  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BLBx-hf5h16ZxeKVJ-n7NCdXIWc8dCJ8CQeduYrz5YLXJvoVbqBQUMUJRR9y1YzKwDG6cGM-HzeAMiGrsACFsQ8';
    this.serviceWorkerRegistration = null;
    this.isInitialized = false;
    this.isSupported = ('serviceWorker' in navigator && 'PushManager' in window);
    this.permissionStatus = ref('default');
    this.isSubscribed = ref(false);
    this.store = null;
    this.applicationServerPublicKey = null;
  }

  /**
   * Check if the browser supports push notifications
   */
  isPushSupported() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Initialize the push notification service
   */
  async initialize() {
    if (!this.isPushSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (this.isInitialized) {
      return;
    }

    try {
      this.store = useStore();
      
      // Register service worker if it's not registered yet
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      }

      // Fetch the public VAPID key from the server
      const response = await fetch('/api/notifications/vapid-public-key');
      const data = await response.json();
      this.applicationServerPublicKey = data.publicKey;

      // Check if already subscribed
      await this.checkSubscriptionStatus();

      // Update permission status
      this.permissionStatus.value = Notification.permission;

      // Set up service worker message event handler
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

      this.isInitialized = true;
      return this.serviceWorkerRegistration;
    } catch (error) {
      console.error('Error initializing push notification service:', error);
      return false;
    }
  }

  /**
   * Get the current permission status for notifications
   * Returns: 'default', 'granted', 'denied'
   */
  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Request permission to send notifications
   * Returns: true if permission granted, false otherwise
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus.value = permission;
      
      if (permission === 'granted') {
        await this.subscribe();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Convert base64 string to Uint8Array for the applicationServerKey
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if the user is already subscribed to push notifications
   */
  async checkSubscriptionStatus() {
    if (!this.serviceWorkerRegistration) {
      return false;
    }
    
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      this.isSubscribed.value = !!subscription;
      return this.isSubscribed.value;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   * Returns the subscription object if successful, null otherwise
   */
  async subscribe() {
    if (!this.isSupported || !this.serviceWorkerRegistration) {
      return null;
    }

    try {
      // Get existing subscription
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      // If already subscribed, return true
      if (subscription) {
        this.isSubscribed.value = true;
        return subscription;
      }
      
      // Subscribe to push notifications
      const applicationServerKey = this.urlBase64ToUint8Array(this.applicationServerPublicKey);
      subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      // Save subscription on the server
      await this.saveSubscription(subscription);
      
      this.isSubscribed.value = true;
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   * Returns true if unsubscribed successfully, false otherwise
   */
  async unsubscribe() {
    if (!this.isSupported || !this.serviceWorkerRegistration) {
      return false;
    }

    try {
      // Get existing subscription
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        this.isSubscribed.value = false;
        return true;
      }
      
      // Unsubscribe from push manager
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Delete subscription from server
        await this.deleteSubscription(subscription);
        console.log('User is unsubscribed from push notifications');
      }
      
      this.isSubscribed.value = false;
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Save subscription to the server
   * @param {PushSubscription} subscription - Push subscription object
   */
  async saveSubscription(subscription) {
    try {
      await axios.post('/api/notifications/subscribe', {
        subscription,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  /**
   * Delete subscription from the server
   * @param {PushSubscription} subscription - Push subscription object
   */
  async deleteSubscription(subscription) {
    try {
      await axios.post('/api/notifications/unsubscribe', {
        subscription
      });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   */
  async updatePreferences(preferences) {
    try {
      await axios.put('/api/notifications/preferences', preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences() {
    try {
      const response = await axios.get('/api/notifications/preferences');
      return response.data.data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Handle messages from service worker
   * @param {MessageEvent} event - Message event
   */
  handleServiceWorkerMessage = (event) => {
    if (!event.data) return;

    switch (event.data.type) {
      case 'PUSH_RECEIVED':
        // Add notification to Vuex store
        if (this.store) {
          this.store.dispatch('notifications/addNotification', event.data.notification);
        }
        break;
        
      case 'NOTIFICATION_CLICKED':
        // Handle notification click
        if (this.store) {
          this.store.dispatch('notifications/handleNotificationClick', event.data.notification);
        }
        break;
    }
  }

  /**
   * Display a notification using the Notifications API (not push)
   * This is useful for local notifications that don't need to come from the server
   */
  async showLocalNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Use the service worker to show the notification
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, {
          icon: '/img/icons/android-chrome-192x192.png',
          badge: '/img/icons/badge-128x128.png',
          ...options
        });
        return true;
      } else {
        // Fallback to regular notification if service worker is not available
        const notification = new Notification(title, {
          icon: '/img/icons/android-chrome-192x192.png',
          ...options
        });
        return true;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();