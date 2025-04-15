const CACHE_NAME = 'ubereat-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-512x512.png',
  '/img/icons/notification-icon.png',
  '/img/icons/badge-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.message || data.body,
      icon: data.icon || '/img/icons/notification-icon.png',
      badge: data.badge || '/img/icons/badge-icon.png',
      timestamp: data.timestamp || Date.now(),
      tag: data.tag || 'default',
      data: data
    };

    // Add actions based on notification type
    switch (data.type) {
      case 'order_status':
        options.actions = [
          {
            action: 'view_order',
            title: 'View Order',
            icon: '/img/icons/order.png'
          }
        ];
        break;
      
      case 'driver_location':
        options.actions = [
          {
            action: 'track_order',
            title: 'Track Order',
            icon: '/img/icons/track.png'
          },
          {
            action: 'contact_driver',
            title: 'Contact Driver',
            icon: '/img/icons/contact-driver.png'
          }
        ];
        break;
      
      case 'promotion':
        options.actions = [
          {
            action: 'view_promo',
            title: 'View Offer',
            icon: '/img/icons/promotion.png'
          }
        ];
        break;
      
      case 'chat':
        options.actions = [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/img/icons/chat.png'
          }
        ];
        break;
    }

    // Show notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );

    // Broadcast to client
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'push:received',
          payload: data
        });
      });
    });
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetUrl = '/';
  const notificationData = event.notification.data;

  // Handle different actions
  switch (event.action) {
    case 'view_order':
      targetUrl = `/orders/${notificationData.orderId}`;
      break;
    
    case 'track_order':
      targetUrl = `/orders/${notificationData.orderId}/tracking`;
      break;
    
    case 'contact_driver':
      targetUrl = `/chat/driver/${notificationData.driverId}`;
      break;
    
    case 'view_promo':
      targetUrl = `/promotions/${notificationData.id}`;
      break;
    
    case 'reply':
      targetUrl = `/chat/${notificationData.chatId}`;
      break;
  }

  // Mark notification as read
  markNotificationAsRead(notificationData);
  
  // Open the target URL in an existing window/tab if available, or open new window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's an existing client
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );

  // Broadcast notification click event to clients
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'push:clicked',
        payload: notificationData
      });
    });
  });
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Send new subscription to server
        return fetch('/api/notifications/resubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            old: event.oldSubscription.toJSON(),
            new: subscription.toJSON()
          })
        });
      })
  );
});

// Offline page and asset handling
self.addEventListener('fetch', (event) => {
  // Special handling for icon files
  if (event.request.url.includes('/img/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Otherwise fetch and cache
          return fetch(event.request)
            .then((response) => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response as it can only be used once
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
    return;
  }

  // Default fetch handling for other requests
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return null;
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-status-update') {
    event.waitUntil(syncOrderUpdates());
  } else if (event.tag === 'location-update') {
    event.waitUntil(syncLocationUpdates());
  } else if (event.tag === 'pending-notifications') {
    event.waitUntil(syncPendingNotifications());
  }
});

// Utility function to mark notification as read
async function markNotificationAsRead(notification) {
  if (!notification.id) return;
  
  try {
    await fetch(`/api/notifications/${notification.id}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Sync functions
async function syncOrderUpdates() {
  // Implement order status sync logic
}

async function syncLocationUpdates() {
  // Implement location updates sync logic
}

async function syncPendingNotifications() {
  // Implement pending notifications sync logic
}
