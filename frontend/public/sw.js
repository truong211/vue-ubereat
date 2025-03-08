// Cache name for PWA
const CACHE_NAME = 'food-delivery-v1';

// Assets to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip chrome-extension URLs and non-GET requests
  if (request.url.startsWith('chrome-extension://') || request.method !== 'GET') {
    return;
  }

  // Static assets and other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(request.clone())
          .then((response) => {
            // Don't cache non-successful responses or non-GET requests
            if (!response || response.status !== 200 || request.method !== 'GET') {
              return response;
            }
            
            // Only cache same-origin requests
            const url = new URL(request.url);
            if (url.origin === location.origin) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return null;
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();

    const options = {
      body: data.message,
      icon: '/img/icons/icon-192x192.png',
      badge: '/img/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (e) {
    console.error('Error showing notification:', e);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data;
  if (!data) return;

  // Notify clients about notification close
  event.waitUntil(
    self.clients.matchAll()
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_CLOSED',
            data
          });
        });
      })
  );
});

/**
 * Create notification options based on notification type
 * @param {Object} data Notification data
 * @returns {Object} Notification options
 */
function createNotificationOptions(data) {
  const baseOptions = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      id: data.id,
      type: data.type,
      ...data.data
    },
    requireInteraction: false,
    silent: false
  };

  switch (data.type) {
    case 'order_status':
      return {
        ...baseOptions,
        tag: `order_${data.data.orderId}`,
        actions: [
          {
            action: 'view_order',
            title: 'View Order'
          }
        ],
        requireInteraction: true
      };

    case 'chat_message':
      return {
        ...baseOptions,
        tag: `chat_${data.data.chatId}`,
        actions: [
          {
            action: 'reply',
            title: 'Reply'
          },
          {
            action: 'view_chat',
            title: 'View Chat'
          }
        ],
        renotify: true
      };

    case 'promotion':
      return {
        ...baseOptions,
        tag: `promo_${data.data.promotionId}`,
        image: data.data.image,
        actions: [
          {
            action: 'view_promotion',
            title: 'View Offer'
          }
        ]
      };

    default:
      return baseOptions;
  }
}

/**
 * Handle notification click based on type
 * @param {Object} data Notification data
 * @returns {Promise}
 */
function handleNotificationClick(data) {
  return self.clients.matchAll({ type: 'window' })
    .then((clients) => {
      // Try to find existing window
      const existingClient = clients.find((client) => {
        return client.visibilityState === 'visible';
      });

      let url = '/';
      
      // Determine URL based on notification type
      switch (data.type) {
        case 'order_status':
          url = `/orders/${data.orderId}`;
          break;
          
        case 'chat_message':
          url = `/support/chat/${data.chatId}`;
          break;
          
        case 'promotion':
          url = `/promotions/${data.promotionId}`;
          break;
      }

      if (existingClient) {
        // Focus existing window and navigate
        return existingClient.focus()
          .then(() => existingClient.navigate(url));
      }

      // Open new window
      return self.clients.openWindow(url);
    });
}

// Periodic sync for background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-orders') {
    event.waitUntil(updateOrders());
  }
});

/**
 * Update orders in background
 * @returns {Promise}
 */
async function updateOrders() {
  try {
    // Fetch active orders
    const response = await fetch('/api/orders/active');
    const orders = await response.json();
    
    // Check for status changes
    orders.forEach((order) => {
      // Compare with cached status and notify if changed
      // Implementation depends on how you store cached order states
    });
  } catch (error) {
    console.error('Failed to update orders:', error);
  }
}