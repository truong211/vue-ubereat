import { ref } from 'vue'
import { useStore } from 'vuex'

class OfflineService {
  constructor() {
    this.isOnline = ref(navigator.onLine)
    this.serviceWorkerRegistration = null
    this.pendingSync = new Set()
    this.store = null

    // Set up network status listeners
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  init(store) {
    this.store = store
    this.registerServiceWorker()
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        // Handle updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorkerRegistration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.notifyUpdateAvailable()
            }
          })
        })

        // Set up message listeners
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this))
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }
  }

  // Network Status Handlers
  handleOnline() {
    this.isOnline.value = true
    this.store?.dispatch('ui/showSnackbar', {
      message: 'You are back online',
      color: 'success'
    })
    this.syncPendingOperations()
  }

  handleOffline() {
    this.isOnline.value = false
    this.store?.dispatch('ui/showSnackbar', {
      message: 'You are offline. Changes will be saved when you reconnect.',
      color: 'warning',
      timeout: -1
    })
  }

  // Data Synchronization
  async syncPendingOperations() {
    if (!this.serviceWorkerRegistration) return

    // Sync order status updates
    if (this.pendingSync.has('order-status-update')) {
      try {
        await this.serviceWorkerRegistration.sync.register('order-status-update')
        this.pendingSync.delete('order-status-update')
      } catch (error) {
        console.error('Failed to register order status sync:', error)
      }
    }

    // Sync location updates
    if (this.pendingSync.has('location-update')) {
      try {
        await this.serviceWorkerRegistration.sync.register('location-update')
        this.pendingSync.delete('location-update')
      } catch (error) {
        console.error('Failed to register location sync:', error)
      }
    }
  }

  // Queue operations for sync
  queueOperation(type, data) {
    if (!navigator.onLine) {
      this.pendingSync.add(type)
      this.storeOfflineData(type, data)
    }
  }

  // IndexedDB Operations
  async storeOfflineData(type, data) {
    const db = await this.openDb()
    const tx = db.transaction('offline_data', 'readwrite')
    const store = tx.objectStore('offline_data')

    await store.add({
      id: Date.now(),
      type,
      data,
      timestamp: new Date().toISOString()
    })
  }

  async getOfflineData(type) {
    const db = await this.openDb()
    const tx = db.transaction('offline_data', 'readonly')
    const store = tx.objectStore('offline_data')

    return new Promise((resolve, reject) => {
      const request = store.index('type').getAll(type)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Service Worker Message Handler
  handleServiceWorkerMessage(event) {
    const { type, payload } = event.data

    switch (type) {
      case 'SYNC_COMPLETE':
        this.store?.dispatch('ui/showSnackbar', {
          message: 'All changes have been synchronized',
          color: 'success'
        })
        break

      case 'SYNC_ERROR':
        this.store?.dispatch('ui/showSnackbar', {
          message: 'Failed to sync some changes. Will retry later.',
          color: 'error'
        })
        break

      case 'CACHE_UPDATED':
        this.notifyContentUpdated()
        break
    }
  }

  // Update Notifications
  notifyUpdateAvailable() {
    this.store?.dispatch('ui/showDialog', {
      title: 'Update Available',
      message: 'A new version is available. Would you like to update now?',
      buttons: [
        {
          text: 'Update',
          color: 'primary',
          action: () => this.applyUpdate()
        },
        {
          text: 'Later',
          color: 'grey'
        }
      ]
    })
  }

  notifyContentUpdated() {
    this.store?.dispatch('ui/showSnackbar', {
      message: 'New content is available. Please refresh the page.',
      color: 'info',
      action: {
        text: 'REFRESH',
        callback: () => window.location.reload()
      }
    })
  }

  // Service Worker Update
  async applyUpdate() {
    if (!this.serviceWorkerRegistration) return

    const registration = await navigator.serviceWorker.getRegistration()
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  // Database Operations
  openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('driver_app_db', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Offline data store
        const store = db.createObjectStore('offline_data', {
          keyPath: 'id'
        })
        store.createIndex('type', 'type')
        store.createIndex('timestamp', 'timestamp')
      }
    })
  }

  // Push Notification Permissions
  async requestNotificationPermission() {
    if (!('Notification' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  // Push Subscription
  async subscribeToPush() {
    if (!this.serviceWorkerRegistration) return null

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
      })

      // Send subscription to server
      await this.store?.dispatch('user/updatePushSubscription', subscription)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  // Utility functions
  isNetworkAvailable() {
    return this.isOnline.value
  }

  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      )
    }
  }
}

export default new OfflineService()
