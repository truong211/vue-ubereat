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
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  let notificationData = {};
  
  // Try to extract notification data from the push event
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      // If parsing as JSON fails, use the text as the message
      notificationData = {
        title: 'New Notification',
        body: event.data.text()
      };
    }
  } else {
    // Default notification if no data was received
    notificationData = {
      title: 'New Notification',
      body: 'Something happened in the app'
    };
  }

  // Extract notification details
  const title = notificationData.title || 'New Notification';
  const options = {
    body: notificationData.body || '',
    icon: notificationData.icon || '/img/icons/android-chrome-192x192.png',
    badge: notificationData.badge || '/img/icons/badge-128x128.png',
    tag: notificationData.tag || 'default',
    data: notificationData.data || {}, // Additional data for click handler
    actions: notificationData.actions || [],
    vibrate: notificationData.vibrate || [100, 50, 100],
    timestamp: notificationData.timestamp || Date.now()
  };

  // Send message to all clients about the notification
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      if (clientList.length > 0) {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            notification: { ...notificationData }
          });
        });
      }
    });

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user clicking on the notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event);
  
  // Close the notification
  event.notification.close();

  // Handle actions if they exist
  if (event.action) {
    // Handle specific actions
    switch (event.action) {
      case 'view':
        // Handle view action
        break;
      case 'dismiss':
        // Just close the notification (already done)
        return;
      default:
        // Unknown action
        console.log(`Unknown action: ${event.action}`);
    }
  }

  // Get the notification data
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/notifications';

  // Inform clients about the notification click
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      if (clientList.length > 0) {
        // If a window is already open, focus it and send a message
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification: {
              id: notificationData.id,
              url: urlToOpen,
              ...notificationData
            }
          });
        });

        // Focus an existing window if we have one
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    });
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