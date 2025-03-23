// Service Worker for Push Notifications and Offline Support
const CACHE_NAME = 'food-delivery-cache-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline support
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/img/icons/android-chrome-192x192.png',
  '/img/icons/badge-128x128.png',
  '/favicon.ico',
  // Add CSS, JS, and other essential static assets
  '/style.css'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently - don't cache them
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.log('Fetch failed for API request; returning offline response', error);
        
        // If it's a GET request, we can return a generic offline response
        if (event.request.method === 'GET') {
          return new Response(
            JSON.stringify({ error: 'You are offline' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
        // For non-GET requests, throw the error
        throw error;
      })
    );
    return;
  }

  // For non-API requests, try network first, then cache, then offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and update the cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(async () => {
        // Try to get the resource from the cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If request is for a page navigation, return the offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        // If we can't serve from cache or it's not a navigation, fail
        return new Response('Network error', { status: 503 });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    // Send to all window clients
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          notification: data
        });
      });
    });

    // Show notification
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/img/icons/android-chrome-192x192.png',
        badge: '/img/icons/badge-icon.png',
        tag: data.id || 'default',
        data: data,
        actions: [
          {
            action: 'view',
            title: 'Xem chi tiết'
          }
        ]
      })
    );
  }
});

// Notification click event - handle user clicking on the notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const notification = event.notification.data;
  
  // Handle notification click
  if (notification.orderId) {
    // Open order tracking page
    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // If there's an existing window, focus it and navigate
        for (let client of clientList) {
          if (client.url && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              notification: notification
            });
            return;
          }
        }
        // If no window exists, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(`/orders/${notification.orderId}/tracking`);
        }
      })
    );
  }
});

// Notification close event - handle user dismissing the notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event);
  
  // You can track dismissed notifications here if needed
  const notificationData = event.notification.data || {};
  
  // Optionally inform clients about the notification dismissal
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_CLOSED',
          notification: {
            id: notificationData.id,
            ...notificationData
          }
        });
      });
    });
});