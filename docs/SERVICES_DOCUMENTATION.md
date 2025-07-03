# Services and Utilities Documentation

## Overview

This document covers all the services and utilities used throughout the food delivery application, including both backend services and frontend service layers that handle business logic, API communication, and various utilities.

---

## Backend Services

### Authentication Service

**Location:** `backend/src/services/jwt-auth.js`

#### JWT Authentication Service

Handles JWT token generation, validation, and refresh functionality.

**Methods:**

##### `generateTokens(payload)`
Generates access and refresh tokens for a user.

**Parameters:**
- `payload` (Object): User data to encode in token

**Returns:**
```javascript
{
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Usage:**
```javascript
const jwtAuth = require('../services/jwt-auth');

const tokens = jwtAuth.generateTokens({
  id: user.id,
  email: user.email,
  role: user.role
});
```

##### `verifyToken(token)`
Verifies and decodes a JWT token.

**Parameters:**
- `token` (String): JWT token to verify

**Returns:**
- Decoded payload if valid
- `null` if invalid

##### `refreshAccessToken(refreshToken)`
Generates a new access token using a refresh token.

### Social Authentication Service

**Location:** `backend/src/services/social-auth.js`

#### Social Auth Service

Handles Google and Facebook authentication integration.

**Methods:**

##### `verifyGoogleToken(idToken)`
Verifies Google ID token and returns user information.

**Parameters:**
- `idToken` (String): Google ID token

**Returns:**
```javascript
{
  id: "google_user_id",
  email: "user@gmail.com",
  name: "User Name",
  picture: "https://avatar-url.com",
  verified_email: true
}
```

##### `verifyFacebookToken(accessToken)`
Verifies Facebook access token and returns user information.

---

### Order Management Service

**Location:** `backend/src/services/order-optimizer.service.js`

#### Order Optimizer Service

Optimizes order processing, driver assignment, and delivery routes.

**Methods:**

##### `findOptimalDriver(orderDetails)`
Finds the best available driver for an order.

**Parameters:**
```javascript
{
  deliveryAddress: { lat: 40.7128, lng: -74.0060 },
  restaurantLocation: { lat: 40.7589, lng: -73.9851 },
  orderValue: 25.50,
  priority: 'standard' // 'standard', 'premium', 'express'
}
```

**Returns:**
```javascript
{
  driverId: 123,
  estimatedTime: 35, // minutes
  distance: 2.8, // km
  score: 0.95 // optimization score
}
```

##### `calculateDeliveryRoute(pickup, delivery, waypoints)`
Calculates optimal delivery route with multiple stops.

**Parameters:**
- `pickup` (Object): Pickup location coordinates
- `delivery` (Object): Delivery location coordinates  
- `waypoints` (Array): Optional intermediate stops

**Usage:**
```javascript
const optimizer = require('../services/order-optimizer.service');

const driver = await optimizer.findOptimalDriver({
  deliveryAddress: order.deliveryAddress,
  restaurantLocation: restaurant.location,
  orderValue: order.totalAmount,
  priority: order.priority
});
```

##### `optimizeMultipleDeliveries(orders)`
Optimizes delivery sequence for multiple orders assigned to one driver.

---

### Payment Service

**Location:** `backend/src/services/payment.service.js`

#### Payment Processing Service

Handles payment processing with multiple payment providers.

**Methods:**

##### `processPayment(paymentData)`
Processes a payment using the specified payment method.

**Parameters:**
```javascript
{
  amount: 36.31,
  currency: 'USD',
  paymentMethod: 'stripe', // 'stripe', 'paypal', 'vnpay', 'momo'
  paymentToken: 'payment_token_from_frontend',
  orderId: 123,
  description: 'Food delivery order'
}
```

**Returns:**
```javascript
{
  success: true,
  transactionId: 'txn_1234567890',
  status: 'completed',
  amount: 36.31,
  processingFee: 1.08
}
```

##### `refundPayment(transactionId, amount, reason)`
Processes a refund for a completed payment.

**Usage:**
```javascript
const paymentService = require('../services/payment.service');

try {
  const result = await paymentService.processPayment({
    amount: order.totalAmount,
    currency: 'USD',
    paymentMethod: 'stripe',
    paymentToken: req.body.paymentToken,
    orderId: order.id
  });
  
  if (result.success) {
    // Update order status
  }
} catch (error) {
  // Handle payment error
}
```

---

### Notification Service

**Location:** `backend/src/services/notification.service.js`

#### Push Notification Service

Manages push notifications, email notifications, and SMS.

**Methods:**

##### `sendPushNotification(userId, notification)`
Sends push notification to user's devices.

**Parameters:**
```javascript
{
  userId: 123,
  notification: {
    title: "Order Update",
    body: "Your order is being prepared",
    data: {
      orderId: 456,
      type: "order_update"
    },
    icon: "https://app.com/icon.png"
  }
}
```

##### `sendEmail(to, template, data)`
Sends templated email notification.

**Parameters:**
- `to` (String): Recipient email address
- `template` (String): Email template name
- `data` (Object): Template variables

**Usage:**
```javascript
const notificationService = require('../services/notification.service');

// Send order confirmation email
await notificationService.sendEmail(
  user.email,
  'order_confirmation',
  {
    customerName: user.name,
    orderNumber: order.orderNumber,
    items: order.items,
    totalAmount: order.totalAmount
  }
);

// Send push notification
await notificationService.sendPushNotification(user.id, {
  title: "Order Confirmed",
  body: `Your order #${order.orderNumber} has been confirmed`,
  data: { orderId: order.id, type: "order_update" }
});
```

##### `sendSMS(phone, message)`
Sends SMS notification.

---

### Map and Location Service

**Location:** `backend/src/services/map.service.js`

#### Map Service

Provides location-based services, geocoding, and route calculation.

**Methods:**

##### `geocodeAddress(address)`
Converts address to coordinates.

**Parameters:**
- `address` (String): Street address to geocode

**Returns:**
```javascript
{
  latitude: 40.7128,
  longitude: -74.0060,
  formattedAddress: "123 Main St, New York, NY 10001, USA"
}
```

##### `calculateDistance(origin, destination)`
Calculates distance between two points.

**Parameters:**
- `origin` (Object): Starting location {lat, lng}
- `destination` (Object): End location {lat, lng}

**Returns:**
```javascript
{
  distance: 2.5, // kilometers
  duration: 8, // minutes
  route: [/* array of coordinates */]
}
```

##### `findNearbyRestaurants(userLocation, radius)`
Finds restaurants within specified radius.

**Usage:**
```javascript
const mapService = require('../services/map.service');

// Geocode delivery address
const coordinates = await mapService.geocodeAddress(
  "123 Main St, New York, NY"
);

// Calculate delivery distance
const distance = await mapService.calculateDistance(
  restaurant.location,
  coordinates
);
```

---

### Inventory Service

**Location:** `backend/src/services/inventory.service.js`

#### Inventory Management Service

Manages restaurant inventory and item availability.

**Methods:**

##### `checkItemAvailability(restaurantId, itemId, quantity)`
Checks if menu item is available in requested quantity.

##### `updateInventory(restaurantId, itemId, quantity, operation)`
Updates inventory levels for menu items.

**Parameters:**
- `operation` (String): 'add', 'subtract', 'set'

##### `lowStockAlert(restaurantId, threshold)`
Sends alerts for items below stock threshold.

---

## Frontend Services

### API Service

**Location:** `frontend/src/services/api.service.js`

#### HTTP API Client

Centralized API communication service with interceptors and error handling.

**Methods:**

##### `get(url, config)`
Makes GET request to API endpoint.

##### `post(url, data, config)`
Makes POST request with data.

##### `put(url, data, config)`
Makes PUT request for updates.

##### `delete(url, config)`
Makes DELETE request.

**Usage:**
```javascript
import { apiClient } from '@/services/api.service'

// Get user profile
const response = await apiClient.get('/user/profile')

// Update profile
await apiClient.put('/user/profile', {
  name: 'New Name',
  phone: '+1234567890'
})
```

**Interceptors:**
- Automatically adds authentication headers
- Handles token refresh
- Formats error responses
- Prevents duplicate API prefixes

---

### Restaurant API Service

**Location:** `frontend/src/services/restaurant.service.js`

#### Restaurant Management Service

Handles restaurant-related API calls and business logic.

**Methods:**

##### `getRestaurants(filters)`
Fetches restaurants with filtering and pagination.

**Parameters:**
```javascript
{
  page: 1,
  limit: 20,
  category: 'italian',
  search: 'pizza',
  location: { lat: 40.7128, lng: -74.0060 },
  radius: 5000, // meters
  priceRange: [10, 50],
  rating: 4.0,
  isOpen: true,
  deliveryType: 'delivery' // 'delivery', 'pickup', 'both'
}
```

##### `getRestaurantDetails(id)`
Fetches complete restaurant information including menu.

##### `getRestaurantMenu(restaurantId, categoryId)`
Fetches restaurant menu items by category.

**Usage:**
```javascript
import restaurantService from '@/services/restaurant.service'

// Get nearby restaurants
const restaurants = await restaurantService.getRestaurants({
  location: userLocation,
  radius: 5000,
  isOpen: true
})

// Get restaurant menu
const menu = await restaurantService.getRestaurantMenu(
  restaurantId,
  'pizza'
)
```

---

### Cart Service

**Location:** `frontend/src/services/cart.service.js`

#### Shopping Cart Service

Manages shopping cart state and operations.

**Methods:**

##### `addItem(item, options, quantity)`
Adds item to cart with customizations.

**Parameters:**
```javascript
{
  item: {
    id: 123,
    name: "Margherita Pizza",
    price: 12.99,
    restaurantId: 456
  },
  options: [
    { name: "Size", choice: "Large", price: 3.00 },
    { name: "Toppings", choice: "Extra Cheese", price: 1.50 }
  ],
  quantity: 2
}
```

##### `updateItemQuantity(itemId, quantity)`
Updates quantity of existing cart item.

##### `removeItem(itemId)`
Removes item from cart.

##### `calculateTotal()`
Calculates cart subtotal, taxes, and fees.

**Returns:**
```javascript
{
  subtotal: 25.98,
  tax: 2.34,
  deliveryFee: 2.99,
  tip: 5.00,
  total: 36.31
}
```

##### `validateCart()`
Validates cart items availability and pricing.

**Usage:**
```javascript
import cartService from '@/services/cart.service'

// Add item to cart
cartService.addItem({
  id: 123,
  name: "Margherita Pizza",
  price: 12.99,
  restaurantId: 456
}, [
  { name: "Size", choice: "Large", price: 3.00 }
], 2)

// Calculate totals
const totals = cartService.calculateTotal()
```

---

### Location Service

**Location:** `frontend/src/services/location.service.js`

#### Geolocation Service

Handles user location detection and address management.

**Methods:**

##### `getCurrentLocation(options)`
Gets user's current location using browser geolocation.

**Parameters:**
```javascript
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000 // 5 minutes
}
```

**Returns:**
```javascript
{
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10 // meters
}
```

##### `reverseGeocode(lat, lng)`
Converts coordinates to human-readable address.

##### `autocompleteAddress(query)`
Provides address suggestions as user types.

**Usage:**
```javascript
import locationService from '@/services/location.service'

// Get current location
try {
  const location = await locationService.getCurrentLocation()
  
  // Convert to address
  const address = await locationService.reverseGeocode(
    location.latitude,
    location.longitude
  )
} catch (error) {
  // Handle location error
}
```

---

### WebSocket Service

**Location:** `frontend/src/services/websocket.service.js`

#### Real-time Communication Service

Manages WebSocket connections for real-time updates.

**Methods:**

##### `connect(token)`
Establishes WebSocket connection with authentication.

##### `subscribe(event, callback)`
Subscribes to specific event types.

##### `unsubscribe(event, callback)`
Unsubscribes from event types.

##### `emit(event, data)`
Sends data to server via WebSocket.

**Events:**
- `order_update` - Order status changes
- `driver_location` - Driver location updates
- `notification` - New notifications
- `chat_message` - Support chat messages

**Usage:**
```javascript
import websocketService from '@/services/websocket.service'

// Connect to WebSocket
websocketService.connect(authToken)

// Listen for order updates
websocketService.subscribe('order_update', (data) => {
  // Update order status in UI
  updateOrderStatus(data.orderId, data.status)
})

// Listen for driver location
websocketService.subscribe('driver_location', (data) => {
  // Update driver position on map
  updateDriverMarker(data.latitude, data.longitude)
})
```

---

### Analytics Service

**Location:** `frontend/src/services/analytics.service.js`

#### User Analytics Service

Tracks user interactions and sends analytics data.

**Methods:**

##### `trackEvent(eventName, properties)`
Tracks custom events.

**Parameters:**
```javascript
{
  eventName: 'order_placed',
  properties: {
    orderId: 123,
    restaurantId: 456,
    totalAmount: 36.31,
    paymentMethod: 'credit_card',
    deliveryType: 'delivery'
  }
}
```

##### `trackPageView(pageName, properties)`
Tracks page views and navigation.

##### `identifyUser(userId, traits)`
Associates events with specific user.

**Usage:**
```javascript
import analyticsService from '@/services/analytics.service'

// Track order placement
analyticsService.trackEvent('order_placed', {
  orderId: order.id,
  totalAmount: order.total,
  itemCount: order.items.length
})

// Track restaurant view
analyticsService.trackPageView('restaurant_detail', {
  restaurantId: restaurant.id,
  cuisine: restaurant.cuisine
})
```

---

### Offline Service

**Location:** `frontend/src/services/offline.js`

#### Offline Support Service

Manages offline functionality and data synchronization.

**Methods:**

##### `cacheData(key, data, ttl)`
Caches data locally with expiration.

##### `getCachedData(key)`
Retrieves cached data if available and valid.

##### `syncWhenOnline()`
Synchronizes offline actions when connection restored.

##### `isOnline()`
Checks current network status.

**Usage:**
```javascript
import offlineService from '@/services/offline'

// Cache restaurant data
offlineService.cacheData('restaurants', restaurantList, 3600000) // 1 hour

// Get cached data when offline
if (!offlineService.isOnline()) {
  const restaurants = offlineService.getCachedData('restaurants')
}
```

---

## Utility Functions

### Validation Utilities

**Location:** `frontend/src/utils/validation.js`

#### Form Validation Helpers

**Functions:**

##### `validateEmail(email)`
Validates email format.

##### `validatePhone(phone, country)`
Validates phone number format for specific country.

##### `validatePassword(password, requirements)`
Validates password against security requirements.

**Usage:**
```javascript
import { validateEmail, validatePassword } from '@/utils/validation'

const emailError = validateEmail('user@example.com')
const passwordError = validatePassword('password123', {
  minLength: 8,
  requireNumbers: true,
  requireSpecialChars: true
})
```

### Date/Time Utilities

**Location:** `frontend/src/utils/datetime.js`

#### Date and Time Helpers

**Functions:**

##### `formatDate(date, format)`
Formats date according to locale and format.

##### `getRelativeTime(date)`
Returns relative time ("2 hours ago", "in 30 minutes").

##### `isBusinessHours(schedule, datetime)`
Checks if given time falls within business hours.

### Currency Utilities

**Location:** `frontend/src/utils/currency.js`

#### Currency Formatting Helpers

**Functions:**

##### `formatCurrency(amount, currency, locale)`
Formats monetary amounts according to locale.

##### `convertCurrency(amount, fromCurrency, toCurrency)`
Converts between currencies using current exchange rates.

**Usage:**
```javascript
import { formatCurrency } from '@/utils/currency'

const formatted = formatCurrency(36.31, 'USD', 'en-US')
// Returns: "$36.31"
```

---

## Error Handling

### Service-Level Error Handling

All services implement consistent error handling patterns:

```javascript
// Backend Service Error Pattern
try {
  const result = await externalService.call(params)
  return { success: true, data: result }
} catch (error) {
  logger.error('Service error:', error)
  throw new ServiceError(error.message, error.code)
}

// Frontend Service Error Pattern
try {
  const response = await apiClient.get('/endpoint')
  return response.data
} catch (error) {
  if (error.response?.status === 401) {
    // Handle authentication error
    store.dispatch('auth/logout')
  }
  throw new ApiError(error.message, error.response?.status)
}
```

### Global Error Handlers

**Frontend:**
```javascript
// main.js
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
  store.dispatch('ui/showError', err.message)
}
```

**Backend:**
```javascript
// error.middleware.js
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack)
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}
```

---

## Performance Optimization

### Caching Strategies

**Service Worker Caching:**
```javascript
// sw.js
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/restaurants')) {
    event.respondWith(
      caches.open('restaurants-cache').then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      })
    )
  }
})
```

**Memory Caching:**
```javascript
// services/cache.service.js
class CacheService {
  constructor() {
    this.cache = new Map()
    this.ttl = new Map()
  }
  
  set(key, value, ttl = 300000) { // 5 minutes default
    this.cache.set(key, value)
    this.ttl.set(key, Date.now() + ttl)
  }
  
  get(key) {
    if (this.ttl.get(key) < Date.now()) {
      this.cache.delete(key)
      this.ttl.delete(key)
      return null
    }
    return this.cache.get(key)
  }
}
```

### Rate Limiting

**API Rate Limiting:**
```javascript
// services/rate-limiter.service.js
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }
  
  isAllowed(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    // Remove old requests outside window
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    )
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    return true
  }
}
```