# Food Delivery Application - API Documentation

## Overview

This is a comprehensive food delivery application with RESTful APIs built using Node.js, Express, and MySQL. The application supports user authentication, restaurant management, order processing, real-time tracking, and admin functionality.

**Base URL:** `http://localhost:3001/api`

## Authentication

All protected endpoints require JWT token authentication.

### Headers
```javascript
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json"
}
```

---

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**POST** `/api/auth/login`

Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Social Authentication
**POST** `/api/auth/social`

Login/register using social providers (Google, Facebook).

**Request Body:**
```json
{
  "provider": "google",
  "providerId": "google_user_id",
  "email": "user@gmail.com",
  "name": "User Name",
  "avatar": "https://avatar-url.com"
}
```

### Password Reset
**POST** `/api/auth/password/request-reset`

Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**POST** `/api/auth/password/reset`

Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newpassword123"
}
```

---

## User Management Endpoints

### Get User Profile
**GET** `/api/user/profile`
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "avatar": "https://avatar-url.com",
    "addresses": [],
    "favoriteRestaurants": [],
    "loyaltyPoints": 150
  }
}
```

### Update User Profile
**PUT** `/api/user/profile`
*Requires Authentication*

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567891",
  "avatar": "https://new-avatar-url.com"
}
```

### Manage User Addresses
**GET** `/api/addresses`
*Requires Authentication*

**POST** `/api/addresses`
*Requires Authentication*

**Request Body:**
```json
{
  "title": "Home",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "isDefault": false
}
```

**PUT** `/api/addresses/:id`
*Requires Authentication*

**DELETE** `/api/addresses/:id`
*Requires Authentication*

---

## Restaurant Endpoints

### Get All Restaurants
**GET** `/api/restaurants`

**Query Parameters:**
- `page` (integer): Page number for pagination
- `limit` (integer): Items per page
- `category` (string): Filter by category
- `search` (string): Search by name or cuisine
- `lat` (float): User latitude for distance calculation
- `lng` (float): User longitude for distance calculation

**Response:**
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "id": 1,
        "name": "Pizza Palace",
        "description": "Best pizza in town",
        "image": "https://restaurant-image.com",
        "cuisine": "Italian",
        "rating": 4.5,
        "reviewCount": 120,
        "deliveryTime": "30-45 min",
        "deliveryFee": 2.99,
        "minimumOrder": 15.00,
        "isOpen": true,
        "distance": 2.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Get Restaurant Details
**GET** `/api/restaurants/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Pizza Palace",
    "description": "Best pizza in town",
    "image": "https://restaurant-image.com",
    "cuisine": "Italian",
    "rating": 4.5,
    "reviewCount": 120,
    "deliveryTime": "30-45 min",
    "deliveryFee": 2.99,
    "minimumOrder": 15.00,
    "isOpen": true,
    "operatingHours": {
      "monday": { "open": "09:00", "close": "22:00" },
      "tuesday": { "open": "09:00", "close": "22:00" }
    },
    "contact": {
      "phone": "+1234567890",
      "email": "info@pizzapalace.com"
    },
    "address": {
      "street": "456 Food St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10002"
    }
  }
}
```

### Get Restaurant Menu
**GET** `/api/restaurants/:id/menu`

**Query Parameters:**
- `categoryId` (integer): Filter by menu category

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Pizza",
        "description": "Delicious pizzas",
        "items": [
          {
            "id": 1,
            "name": "Margherita Pizza",
            "description": "Fresh tomatoes, mozzarella, and basil",
            "price": 12.99,
            "image": "https://pizza-image.com",
            "isAvailable": true,
            "options": [
              {
                "name": "Size",
                "type": "single",
                "required": true,
                "choices": [
                  { "name": "Small", "price": 0 },
                  { "name": "Medium", "price": 3 },
                  { "name": "Large", "price": 6 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Order Management Endpoints

### Create Order
**POST** `/api/orders`
*Requires Authentication*

**Request Body:**
```json
{
  "restaurantId": 1,
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2,
      "options": [
        {
          "name": "Size",
          "choice": "Large"
        }
      ],
      "specialInstructions": "Extra cheese"
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "paymentMethod": "credit_card",
  "subtotal": 25.98,
  "deliveryFee": 2.99,
  "tax": 2.34,
  "tip": 5.00,
  "totalAmount": 36.31,
  "specialInstructions": "Ring doorbell twice"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "ORD-2024-001",
    "status": "pending",
    "estimatedDeliveryTime": "2024-01-01T14:30:00Z",
    "totalAmount": 36.31,
    "items": [...],
    "deliveryAddress": {...},
    "restaurant": {...}
  }
}
```

### Get User Orders
**GET** `/api/orders`
*Requires Authentication*

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Filter by order status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "ORD-2024-001",
        "status": "delivered",
        "totalAmount": 36.31,
        "createdAt": "2024-01-01T13:00:00Z",
        "deliveredAt": "2024-01-01T14:25:00Z",
        "restaurant": {
          "id": 1,
          "name": "Pizza Palace",
          "image": "https://restaurant-image.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Get Order Details
**GET** `/api/orders/:id`
*Requires Authentication*

### Track Order
**GET** `/api/orders/:id/track`
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 123,
    "status": "in_transit",
    "estimatedDeliveryTime": "2024-01-01T14:30:00Z",
    "driver": {
      "id": 5,
      "name": "Mike Johnson",
      "phone": "+1234567890",
      "vehicle": "Honda Civic - ABC123",
      "rating": 4.8
    },
    "location": {
      "latitude": 40.7580,
      "longitude": -73.9855,
      "updatedAt": "2024-01-01T14:15:00Z"
    },
    "timeline": [
      {
        "status": "confirmed",
        "timestamp": "2024-01-01T13:05:00Z",
        "description": "Order confirmed by restaurant"
      },
      {
        "status": "preparing",
        "timestamp": "2024-01-01T13:10:00Z",
        "description": "Restaurant is preparing your order"
      }
    ]
  }
}
```

### Cancel Order
**POST** `/api/orders/:id/cancel`
*Requires Authentication*

**Request Body:**
```json
{
  "reason": "Changed mind"
}
```

---

## Payment Endpoints

### Process Payment
**POST** `/api/payments/process`
*Requires Authentication*

**Request Body:**
```json
{
  "orderId": 123,
  "amount": 36.31,
  "paymentMethod": "credit_card",
  "paymentToken": "stripe_token_here"
}
```

### Get Payment Methods
**GET** `/api/payments/methods`
*Requires Authentication*

---

## Reviews and Ratings

### Create Review
**POST** `/api/reviews`
*Requires Authentication*

**Request Body:**
```json
{
  "orderId": 123,
  "restaurantId": 1,
  "rating": 5,
  "comment": "Amazing food and fast delivery!",
  "photos": ["https://review-photo.com"]
}
```

### Get Restaurant Reviews
**GET** `/api/restaurants/:id/reviews`

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `rating` (integer): Filter by rating

---

## Notifications

### Get User Notifications
**GET** `/api/notifications`
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Order Delivered",
      "message": "Your order #ORD-2024-001 has been delivered",
      "type": "order_update",
      "isRead": false,
      "createdAt": "2024-01-01T14:30:00Z",
      "data": {
        "orderId": 123
      }
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/api/notifications/:id/read`
*Requires Authentication*

---

## Promotions and Loyalty

### Get Active Promotions
**GET** `/api/promotions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "20% Off First Order",
      "description": "Get 20% off your first order",
      "code": "FIRST20",
      "discountType": "percentage",
      "discountValue": 20,
      "minimumOrder": 15.00,
      "validUntil": "2024-12-31T23:59:59Z",
      "usageLimit": 1000,
      "usedCount": 450
    }
  ]
}
```

### Apply Promotion Code
**POST** `/api/promotions/apply`
*Requires Authentication*

**Request Body:**
```json
{
  "code": "FIRST20",
  "orderTotal": 25.00
}
```

### Get Loyalty Points
**GET** `/api/loyalty/points`
*Requires Authentication*

---

## Admin Endpoints

All admin endpoints require admin authentication and use the prefix `/api/admin`.

### Dashboard Statistics
**GET** `/api/admin/dashboard/stats`
*Requires Admin Authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "growth": 15.2
    },
    "restaurants": {
      "total": 85,
      "growth": 8.5
    },
    "orders": {
      "total": 5670,
      "growth": 22.1
    },
    "revenue": {
      "total": 234567.89,
      "growth": 18.7
    }
  }
}
```

### Generic CRUD Operations
The admin API supports generic CRUD operations for all database tables:

**GET** `/api/admin/:tableName` - Get all records from table
**POST** `/api/admin/:tableName` - Create new record
**GET** `/api/admin/:tableName/:id` - Get specific record
**PUT** `/api/admin/:tableName/:id` - Update record
**DELETE** `/api/admin/:tableName/:id` - Delete record

**Example - Get Users:**
```bash
GET /api/admin/users?page=1&limit=10&search=john
```

**Example - Create Restaurant:**
```bash
POST /api/admin/restaurants
Content-Type: application/json

{
  "name": "New Restaurant",
  "email": "contact@newrestaurant.com",
  "cuisine": "Italian",
  "status": "pending"
}
```

---

## WebSocket Events

The application uses Socket.IO for real-time updates.

### Connection
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Order Updates
```javascript
// Listen for order status updates
socket.on('order_update', (data) => {
  console.log('Order update:', data);
  // data: { orderId, status, message, driver?, location? }
});
```

#### Driver Location Updates
```javascript
// Listen for driver location updates
socket.on('driver_location', (data) => {
  console.log('Driver location:', data);
  // data: { orderId, driverId, latitude, longitude, timestamp }
});
```

#### Notifications
```javascript
// Listen for new notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // data: { id, title, message, type, data }
});
```

#### Admin Events
```javascript
// Listen for new orders (admin/restaurant)
socket.on('new_order', (data) => {
  console.log('New order received:', data);
});

// Listen for system alerts
socket.on('system_alert', (data) => {
  console.log('System alert:', data);
});
```

---

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 6 characters"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ERROR` - Resource already exists
- `PAYMENT_ERROR` - Payment processing failed
- `DELIVERY_ERROR` - Delivery service unavailable
- `INTERNAL_ERROR` - Server internal error

---

## Rate Limiting

- General API: 100 requests per minute per IP
- Authentication endpoints: 5 requests per minute per IP
- Payment endpoints: 10 requests per minute per user

---

## API Versioning

Current API version: v1
Version is included in the base URL: `/api/v1/` (optional, defaults to v1)

---

## Testing

Use the provided test files to verify API functionality:

```bash
# Test database connection
node test-db-connection.js

# Test API endpoints
node backend/test-api-connection.js
```

Example API test with curl:

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get restaurants (with auth token)
curl -X GET http://localhost:3001/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```