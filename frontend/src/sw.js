const CACHE_NAME = 'food-delivery-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-512x512.png',
  '/img/icons/restaurant-marker.png',
  '/img/icons/customer-marker.png',
  '/img/icons/driver-marker.png'
]

const DYNAMIC_CACHE_PATTERNS = [
  /^\/api\/orders\//,
  /^\/api\/driver\/profile/,
  /^\/api\/driver\/earnings/,
  /^\/api\/driver\/performance/
]

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Try to cache assets but don't fail if some are missing
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => console.warn('Some assets failed to cache:', err));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Network error', offline: true }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cache the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch(err => console.warn('Failed to cache response:', err));

            return networkResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then(response => response || new Response('Offline page not found', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain' }
                }));
            }
            
            // Return error response for other requests
            return new Response(
              JSON.stringify({ error: 'Network error' }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-status-update') {
    event.waitUntil(syncOrderUpdates())
  } else if (event.tag === 'location-update') {
    event.waitUntil(syncLocationUpdates())
  } else if (event.tag === 'pending-notifications') {
    event.waitUntil(syncPendingNotifications())
  }
})

// Enhanced Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const notificationType = data.type || 'general';
    
    // Default options
    const options = {
      body: data.message || data.body,
      icon: data.icon || '/img/icons/icon-192x192.png',
      badge: data.badge || '/img/icons/badge.png',
      vibrate: data.vibrate || [100, 50, 100],
      data: {
        url: data.url || '/',
        type: notificationType,
        id: data.id,
        timestamp: Date.now()
      },
      tag: data.tag || notificationType, // Group similar notifications
      renotify: data.renotify || false, // Whether to notify if using the same tag
      requireInteraction: data.requireInteraction || false // Keep notification visible until user interacts
    };

    // Add actions based on notification type
    switch(notificationType) {
      case 'order_update':
        options.actions = [
          {
            action: 'view_order',
            title: 'View Order',
            icon: '/img/icons/view-order.png'
          }
        ];
        break;
      
      case 'delivery_update':
        options.actions = [
          {
            action: 'track_order',
            title: 'Track Order',
            icon: '/img/icons/track-order.png'
          },
          {
            action: 'contact_driver',
            title: 'Contact Driver',
            icon: '/img/icons/contact-driver.png'
          }
        ];
        break;
      
      case 'restaurant_update':
        options.actions = [
          {
            action: 'view_restaurant',
            title: 'View Restaurant',
            icon: '/img/icons/restaurant.png'
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
        
      case 'chat_message':
        options.actions = [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/img/icons/reply.png'
          }
        ];
        // Show chat message preview
        if (data.image) {
          options.image = data.image;
        }
        break;
    }

    // Sound if specified and supported
    if (data.sound && 'silent' in options) {
      options.silent = false;
      options.sound = data.sound;
    }

    // Show notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          // Store notification in IDB for history/tracking
          return storeNotification(data, options);
        })
    );
  } catch (error) {
    console.error('Push notification error:', error);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification.',
        icon: '/img/icons/icon-192x192.png'
      })
    );
  }
});

// Enhanced Notification Click
self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();
  
  // Get action and notification data
  const action = event.action;
  const notificationData = event.notification.data;
  let targetUrl = notificationData.url || '/';
  
  // Handle different actions
  switch(action) {
    case 'view_order':
      targetUrl = `/orders/${notificationData.id}`;
      break;
      
    case 'track_order':
      targetUrl = `/order-tracking/${notificationData.id}`;
      break;
      
    case 'contact_driver':
      targetUrl = `/chat/driver/${notificationData.driverId}`;
      break;
      
    case 'view_restaurant':
      targetUrl = `/restaurants/${notificationData.id}`;
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
});

// Helper Functions
async function handleApiGet(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

async function handleApiMutation(request) {
  try {
    // Try to perform the mutation
    const response = await fetch(request)
    return response
  } catch (error) {
    // Store failed mutations for retry
    await storeFailedMutation(request)
    return new Response(JSON.stringify({
      error: 'Operation queued for sync',
      offline: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function shouldCacheDynamically(url) {
  return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url))
}

async function storeFailedMutation(request) {
  const db = await openDb()
  const tx = db.transaction('failed_mutations', 'readwrite')
  const store = tx.objectStore('failed_mutations')
  
  await store.add({
    id: Date.now(),
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: new Date().toISOString()
  })
}

async function syncOrderUpdates() {
  const db = await openDb()
  const tx = db.transaction('failed_mutations', 'readwrite')
  const store = tx.objectStore('failed_mutations')
  
  const mutations = await store.index('type').getAll('order_status')
  
  for (const mutation of mutations) {
    try {
      await fetch(mutation.url, {
        method: mutation.method,
        headers: new Headers(mutation.headers),
        body: mutation.body
      })
      await store.delete(mutation.id)
    } catch (error) {
      console.error('Failed to sync mutation:', error)
    }
  }
}

async function syncLocationUpdates() {
  const db = await openDb()
  const tx = db.transaction('failed_mutations', 'readwrite')
  const store = tx.objectStore('failed_mutations')
  
  const mutations = await store.index('type').getAll('location_update')
  
  for (const mutation of mutations) {
    try {
      await fetch(mutation.url, {
        method: mutation.method,
        headers: new Headers(mutation.headers),
        body: mutation.body
      })
      await store.delete(mutation.id)
    } catch (error) {
      console.error('Failed to sync location:', error)
    }
  }
}

async function syncPendingNotifications() {
  const db = await openDb();
  const tx = db.transaction('notifications', 'readwrite');
  const store = tx.objectStore('notifications');
  
  const pendingNotifications = await store.index('status').getAll('pending');
  
  for (const notification of pendingNotifications) {
    try {
      // Send read status to server
      await fetch('/api/notifications/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: notification.id,
          status: notification.status,
          readAt: notification.readAt
        })
      });
      
      // Update local status
      notification.synced = true;
      await store.put(notification);
    } catch (error) {
      console.error('Failed to sync notification:', error);
    }
  }
}

async function storeNotification(data, options) {
  const db = await openDb();
  const tx = db.transaction('notifications', 'readwrite');
  const store = tx.objectStore('notifications');
  
  await store.add({
    id: data.id || Date.now().toString(),
    title: data.title,
    message: data.message || data.body,
    type: data.type || 'general',
    url: options.data.url,
    status: 'delivered',
    createdAt: new Date().toISOString(),
    readAt: null,
    synced: false
  });
}

async function markNotificationAsRead(notificationData) {
  const db = await openDb();
  const tx = db.transaction('notifications', 'readwrite');
  const store = tx.objectStore('notifications');
  
  // Find the notification
  const notificationId = notificationData.id;
  if (!notificationId) return;
  
  try {
    const notification = await store.get(notificationId);
    if (notification) {
      notification.status = 'read';
      notification.readAt = new Date().toISOString();
      notification.synced = false;
      await store.put(notification);
      
      // Trigger background sync to update server
      await self.registration.sync.register('pending-notifications');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('food_delivery_db', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for failed API mutations
      if (!db.objectStoreNames.contains('failed_mutations')) {
        const mutationsStore = db.createObjectStore('failed_mutations', {
          keyPath: 'id'
        });
        mutationsStore.createIndex('type', 'type');
        mutationsStore.createIndex('timestamp', 'timestamp');
      }

      // Store for offline data
      if (!db.objectStoreNames.contains('offline_data')) {
        db.createObjectStore('offline_data', {
          keyPath: 'id'
        });
      }
      
      // Store for notifications
      if (!db.objectStoreNames.contains('notifications')) {
        const notificationsStore = db.createObjectStore('notifications', {
          keyPath: 'id'
        });
        notificationsStore.createIndex('status', 'status');
        notificationsStore.createIndex('type', 'type');
        notificationsStore.createIndex('createdAt', 'createdAt');
        notificationsStore.createIndex('readAt', 'readAt');
      }
    }
  });
}
