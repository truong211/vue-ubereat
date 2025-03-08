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
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const { request } = event

  // API requests
  if (request.url.includes('/api/')) {
    // Handle based on request type
    if (request.method === 'GET') {
      event.respondWith(handleApiGet(request))
    } else {
      event.respondWith(handleApiMutation(request))
    }
    return
  }

  // Static assets and other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(request).then((response) => {
          // Cache assets that match dynamic patterns
          if (shouldCacheDynamically(request.url)) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone())
              return response
            })
          }
          return response
        })
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
        return null
      })
  )
})

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-status-update') {
    event.waitUntil(syncOrderUpdates())
  } else if (event.tag === 'location-update') {
    event.waitUntil(syncLocationUpdates())
  }
})

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data.json()

  const options = {
    body: data.message,
    icon: '/img/icons/icon-192x192.png',
    badge: '/img/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})

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

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('driver_app_db', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Store for failed API mutations
      const store = db.createObjectStore('failed_mutations', {
        keyPath: 'id'
      })
      store.createIndex('type', 'type')
      store.createIndex('timestamp', 'timestamp')

      // Store for offline data
      db.createObjectStore('offline_data', {
        keyPath: 'id'
      })
    }
  })
}
