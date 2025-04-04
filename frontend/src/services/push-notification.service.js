import { ref } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';

/**
 * Push Notification Service
 * Handles browser push notifications using the Web Push API
 */

class PushNotificationService {
  constructor() {
    this.publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    this.supported = 'Notification' in window && 'serviceWorker' in navigator;
    this.notificationClickHandlers = new Map();
    this.serviceWorkerRegistration = null;
    this.isInitialized = false;
    this.permissionStatus = ref('default');
    this.isSubscribed = ref(false);
    this.store = null;
    this.applicationServerPublicKey = null;
  }

  isPushSupported() {
    return this.supported;
  }

  getPermissionStatus() {
    if (!this.supported) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.supported) return false;
    
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

  async init() {
    if (!this.supported) return;

    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Listen for push notifications
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          this.handlePushReceived(event.data.notification);
        }
      });

      return registration;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      throw error;
    }
  }

  async subscribe() {
    if (!this.supported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
      });

      // Send subscription to backend
      await this.sendSubscriptionToServer(subscription);

      this.isSubscribed.value = true;
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  async unsubscribe() {
    if (!this.supported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Send unsubscription to backend
        await this.sendUnsubscriptionToServer(subscription);
        await subscription.unsubscribe();
      }

      this.isSubscribed.value = false;
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async checkSubscriptionStatus() {
    if (!this.supported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.isSubscribed.value = !!subscription;
      return this.isSubscribed.value;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Alias for getPermissionStatus for backward compatibility
  checkPermission() {
    return this.getPermissionStatus();
  }

  handlePushReceived(notification) {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('push:received', {
      detail: notification
    }));

    // Show notification if app is not focused
    if (!document.hasFocus()) {
      this.showNotification(notification);
    }
  }

  async showNotification(notification) {
    if (!this.supported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/img/icons/android-chrome-192x192.png',
        badge: '/img/icons/badge-icon.png',
        tag: notification.id,
        data: notification
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Helper function to convert VAPID key
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

  // Send subscription to backend
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  // Send unsubscription to backend
  async sendUnsubscriptionToServer(subscription) {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      });
    } catch (error) {
      console.error('Error sending unsubscription to server:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();