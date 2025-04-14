import { ref } from 'vue';

class ServiceWorkerRegistrationService {
  constructor() {
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator;
    this.updateAvailable = ref(false);
    this.refreshing = false;
  }

  async register() {
    if (!this.isSupported) {
      console.warn('Service Worker is not supported in this browser');
      return null;
    }

    try {
      // Only register in production or if explicitly enabled
      if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true') {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('ServiceWorker registered with scope:', this.registration.scope);
        
        // Set up update handling
        this.setupUpdateHandling();
        
        // Set up message handling
        this.setupMessageHandling();
        
        return this.registration;
      } else {
        // Unregister any existing service workers in development
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('ServiceWorker unregistered in development');
        return null;
      }
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
      throw error;
    }
  }

  setupUpdateHandling() {
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateAvailable.value = true;
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });

    // Handle controller change (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!this.refreshing) {
        this.refreshing = true;
        window.location.reload();
      }
    });
  }

  setupMessageHandling() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      switch (type) {
        case 'PUSH_RECEIVED':
          window.dispatchEvent(new CustomEvent('push-notification-received', { detail: payload }));
          break;
        case 'SYNC_COMPLETE':
          window.dispatchEvent(new CustomEvent('sync-complete', { detail: payload }));
          break;
        case 'SYNC_ERROR':
          window.dispatchEvent(new CustomEvent('sync-error', { detail: payload }));
          break;
        case 'CACHE_UPDATED':
          window.dispatchEvent(new CustomEvent('cache-updated', { detail: payload }));
          break;
      }
    });
  }

  async update() {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('Error checking for ServiceWorker updates:', error);
    }
  }

  async applyUpdate() {
    if (!this.registration || !this.registration.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export const swRegistrationService = new ServiceWorkerRegistrationService(); 