# Database Models and Configuration Documentation

## Overview

This food delivery application uses MySQL as the primary database with custom model implementations that provide an ORM-like interface for database operations. The database schema supports users, restaurants, orders, payments, and all related entities.

**Database Engine:** MySQL 8.0+  
**Connection:** mysql2 Node.js driver  
**Schema Location:** `food_Delivery.sql`

---

## Database Schema Overview

### Core Entities

1. **Users** - Customer, restaurant owner, driver, and admin accounts
2. **Restaurants** - Restaurant information and settings
3. **Menu Items** - Food items and categories
4. **Orders** - Order processing and tracking
5. **Payments** - Payment transactions and methods
6. **Reviews** - Customer reviews and ratings
7. **Notifications** - Push notifications and alerts
8. **Addresses** - Delivery addresses
9. **Promotions** - Discounts and loyalty programs

---

## Model Implementations

### User Model

**Location:** `backend/models/user.js`

#### Schema
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  phone VARCHAR(20),
  avatar TEXT,
  role ENUM('customer', 'restaurant_owner', 'driver', 'admin') DEFAULT 'customer',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  emailVerified BOOLEAN DEFAULT FALSE,
  phoneVerified BOOLEAN DEFAULT FALSE,
  socialProvider VARCHAR(50),
  socialId VARCHAR(255),
  notificationPreferences JSON,
  favoriteRestaurants JSON,
  favoriteDishes JSON,
  loyaltyPoints INT DEFAULT 0,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Model Methods

##### Static Methods

**`findAll(options)`**
```javascript
// Find users with filtering and pagination
const users = await User.findAll({
  where: {
    role: 'customer',
    status: 'active'
  },
  limit: 10,
  offset: 0,
  order: [['createdAt', 'DESC']]
});
```

**`findByPk(id)`**
```javascript
// Find user by primary key
const user = await User.findByPk(123);
```

**`findByEmail(email)`**
```javascript
// Find user by email
const user = await User.findByEmail('user@example.com');
```

**`create(userData)`**
```javascript
// Create new user
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed_password',
  role: 'customer'
});
```

**`update(data, options)`**
```javascript
// Update user
await User.update(
  { name: 'New Name' },
  { where: { id: 123 } }
);
```

**`correctPassword(candidatePassword, userPassword)`**
```javascript
// Verify password
const isValid = await User.correctPassword('password123', user.password);
```

#### Instance Properties
```javascript
{
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  role: "customer",
  status: "active",
  emailVerified: true,
  loyaltyPoints: 150,
  notificationPreferences: {
    email: true,
    push: true,
    sms: false
  },
  favoriteRestaurants: [1, 5, 12],
  createdAt: "2024-01-01T10:00:00Z"
}
```

---

### Restaurant Model

**Location:** `backend/models/restaurant.js`

#### Schema
```sql
CREATE TABLE restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image TEXT,
  coverImage TEXT,
  cuisine VARCHAR(100),
  ownerId INT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviewCount INT DEFAULT 0,
  isOpen BOOLEAN DEFAULT TRUE,
  status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
  operatingHours JSON,
  deliveryFee DECIMAL(10, 2) DEFAULT 0.00,
  minimumOrder DECIMAL(10, 2) DEFAULT 0.00,
  deliveryTime VARCHAR(50),
  features JSON, -- parking, wifi, outdoor_seating
  paymentMethods JSON,
  tags JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Model Methods

**`findNearby(latitude, longitude, radius)`**
```javascript
// Find restaurants within radius
const restaurants = await Restaurant.findNearby(40.7128, -74.0060, 5000);
```

**`updateRating(restaurantId)`**
```javascript
// Recalculate restaurant rating
await Restaurant.updateRating(123);
```

**`getOperatingStatus(restaurantId, datetime)`**
```javascript
// Check if restaurant is open at specific time
const isOpen = await Restaurant.getOperatingStatus(123, new Date());
```

#### Instance Properties
```javascript
{
  id: 1,
  name: "Pizza Palace",
  description: "Authentic Italian pizzas",
  cuisine: "Italian",
  rating: 4.5,
  reviewCount: 120,
  isOpen: true,
  operatingHours: {
    monday: { open: "09:00", close: "22:00" },
    tuesday: { open: "09:00", close: "22:00" }
  },
  deliveryFee: 2.99,
  minimumOrder: 15.00,
  location: {
    latitude: 40.7589,
    longitude: -73.9851
  }
}
```

---

### Order Model

#### Schema
```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderNumber VARCHAR(50) UNIQUE NOT NULL,
  userId INT NOT NULL,
  restaurantId INT NOT NULL,
  driverId INT,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
  items JSON NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  deliveryFee DECIMAL(10, 2) DEFAULT 0.00,
  tip DECIMAL(10, 2) DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  totalAmount DECIMAL(10, 2) NOT NULL,
  paymentMethod VARCHAR(50),
  paymentStatus ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  paymentId VARCHAR(255),
  deliveryType ENUM('delivery', 'pickup') DEFAULT 'delivery',
  deliveryAddress JSON,
  estimatedDeliveryTime DATETIME,
  actualDeliveryTime DATETIME,
  specialInstructions TEXT,
  promotionCode VARCHAR(50),
  cancelReason TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Order Item Structure
```javascript
// items JSON field structure
[
  {
    menuItemId: 123,
    name: "Margherita Pizza",
    price: 12.99,
    quantity: 2,
    options: [
      {
        name: "Size",
        choice: "Large",
        price: 3.00
      }
    ],
    specialInstructions: "Extra cheese",
    totalPrice: 31.98
  }
]
```

#### Order Delivery Address Structure
```javascript
// deliveryAddress JSON field structure
{
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  country: "USA",
  latitude: 40.7128,
  longitude: -74.0060,
  instructions: "Ring doorbell twice"
}
```

---

### Menu Items and Categories

#### Menu Categories Schema
```sql
CREATE TABLE menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image TEXT,
  sortOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);
```

#### Menu Items Schema
```sql
CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT NOT NULL,
  categoryId INT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  isAvailable BOOLEAN DEFAULT TRUE,
  isVegetarian BOOLEAN DEFAULT FALSE,
  isVegan BOOLEAN DEFAULT FALSE,
  isGlutenFree BOOLEAN DEFAULT FALSE,
  allergens JSON,
  nutritionInfo JSON,
  options JSON, -- size, toppings, etc.
  preparationTime INT, -- minutes
  sortOrder INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES menu_categories(id) ON DELETE SET NULL
);
```

#### Menu Item Options Structure
```javascript
// options JSON field structure
[
  {
    name: "Size",
    type: "single", // single, multiple
    required: true,
    choices: [
      { name: "Small", price: 0 },
      { name: "Medium", price: 3.00 },
      { name: "Large", price: 6.00 }
    ]
  },
  {
    name: "Toppings",
    type: "multiple",
    required: false,
    maxChoices: 3,
    choices: [
      { name: "Extra Cheese", price: 1.50 },
      { name: "Pepperoni", price: 2.00 },
      { name: "Mushrooms", price: 1.00 }
    ]
  }
]
```

---

### Reviews and Ratings

#### Schema
```sql
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  restaurantId INT NOT NULL,
  orderId INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos JSON,
  isVerified BOOLEAN DEFAULT FALSE,
  response TEXT, -- restaurant response
  responseDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
);
```

#### Review Photo Structure
```javascript
// photos JSON field structure
[
  {
    url: "https://reviews.example.com/photo1.jpg",
    thumbnail: "https://reviews.example.com/thumb1.jpg",
    caption: "Delicious pizza!"
  }
]
```

---

### Notifications

#### Schema
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSON,
  isRead BOOLEAN DEFAULT FALSE,
  isSystemWide BOOLEAN DEFAULT FALSE,
  validUntil DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Notification Types
- `order_update` - Order status changes
- `promotion` - Promotional offers
- `review_request` - Request for review
- `payment_failed` - Payment issues
- `delivery_update` - Delivery tracking
- `system_alert` - System-wide announcements

#### Notification Data Structure
```javascript
// data JSON field structure
{
  orderId: 123,
  restaurantId: 456,
  actionUrl: "/orders/123",
  imageUrl: "https://notifications.example.com/image.jpg",
  metadata: {
    orderNumber: "ORD-2024-001",
    amount: 36.31
  }
}
```

---

### Addresses

#### Schema
```sql
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  zipCode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  isDefault BOOLEAN DEFAULT FALSE,
  deliveryInstructions TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### Promotions and Loyalty

#### Promotions Schema
```sql
CREATE TABLE promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE,
  discountType ENUM('percentage', 'fixed_amount', 'free_delivery') NOT NULL,
  discountValue DECIMAL(10, 2) NOT NULL,
  minimumOrder DECIMAL(10, 2) DEFAULT 0.00,
  maximumDiscount DECIMAL(10, 2),
  usageLimit INT,
  usedCount INT DEFAULT 0,
  userLimit INT DEFAULT 1,
  restaurantId INT,
  applicableCategories JSON,
  validFrom DATETIME NOT NULL,
  validUntil DATETIME NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);
```

#### Loyalty Points Schema
```sql
CREATE TABLE loyalty_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  orderId INT,
  points INT NOT NULL,
  type ENUM('earned', 'redeemed', 'expired', 'bonus') NOT NULL,
  description VARCHAR(255),
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
);
```

---

## Database Configuration

### Connection Setup

**Location:** `backend/src/config/database.js`

```javascript
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_delivery',
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  reconnect: true,
  timezone: 'Z'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Query helper function
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = { pool, query };
```

### Environment Variables

**Required Environment Variables:**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=food_delivery

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your_session_secret

# API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_key
STRIPE_SECRET_KEY=your_stripe_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/firebase-key.json

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

---

## Database Migrations and Seeding

### Initial Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE food_delivery;"

# Import schema
mysql -u root -p food_delivery < food_Delivery.sql

# Run setup script
node setup-database.js
```

### Test Data Seeding

**Location:** `backend/scripts/seed-data.js`

```javascript
const seedData = async () => {
  // Create admin user
  await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: await bcrypt.hash('admin123', 12),
    role: 'admin',
    emailVerified: true
  });

  // Create sample restaurants
  const restaurant = await Restaurant.create({
    name: 'Pizza Palace',
    description: 'Authentic Italian pizzas',
    cuisine: 'Italian',
    address: '123 Food Street, New York, NY',
    latitude: 40.7589,
    longitude: -73.9851,
    deliveryFee: 2.99,
    minimumOrder: 15.00
  });

  // Create menu categories and items
  const category = await MenuCategory.create({
    restaurantId: restaurant.id,
    name: 'Pizzas',
    description: 'Delicious wood-fired pizzas'
  });

  await MenuItem.create({
    restaurantId: restaurant.id,
    categoryId: category.id,
    name: 'Margherita Pizza',
    description: 'Fresh tomatoes, mozzarella, and basil',
    price: 12.99,
    options: [
      {
        name: 'Size',
        type: 'single',
        required: true,
        choices: [
          { name: 'Small', price: 0 },
          { name: 'Medium', price: 3 },
          { name: 'Large', price: 6 }
        ]
      }
    ]
  });
};
```

---

## Database Indexes and Performance

### Recommended Indexes

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Restaurant indexes
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX idx_restaurants_status ON restaurants(status, isOpen);

-- Order indexes
CREATE INDEX idx_orders_user ON orders(userId, createdAt);
CREATE INDEX idx_orders_restaurant ON orders(restaurantId, createdAt);
CREATE INDEX idx_orders_driver ON orders(driverId, status);
CREATE INDEX idx_orders_status ON orders(status, createdAt);

-- Menu item indexes
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurantId, isAvailable);
CREATE INDEX idx_menu_items_category ON menu_items(categoryId, sortOrder);

-- Review indexes
CREATE INDEX idx_reviews_restaurant ON reviews(restaurantId, createdAt);
CREATE INDEX idx_reviews_user ON reviews(userId, createdAt);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(userId, isRead, createdAt);
CREATE INDEX idx_notifications_system ON notifications(isSystemWide, validUntil);
```

### Query Optimization

**Efficient Restaurant Search:**
```javascript
// Optimized nearby restaurant query
const findNearbyRestaurants = async (lat, lng, radius, limit = 20) => {
  const sql = `
    SELECT *, 
           (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
           sin(radians(latitude)))) AS distance
    FROM restaurants
    WHERE status = 'approved' 
      AND isOpen = TRUE
      AND latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    HAVING distance <= ?
    ORDER BY distance
    LIMIT ?
  `;
  
  const latRange = radius / 111; // Approximate km to degree conversion
  const lngRange = radius / (111 * Math.cos(lat * Math.PI / 180));
  
  return await query(sql, [
    lat, lng, lat,
    lat - latRange, lat + latRange,
    lng - lngRange, lng + lngRange,
    radius, limit
  ]);
};
```

---

## Database Monitoring and Maintenance

### Health Checks

**Connection Monitoring:**
```javascript
const checkDatabaseHealth = async () => {
  try {
    const [result] = await pool.execute('SELECT 1 as healthy');
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
};
```

### Backup Strategy

**Daily Backup Script:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="food_delivery"

mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Performance Monitoring

**Slow Query Detection:**
```javascript
const monitorSlowQueries = () => {
  pool.on('connection', (connection) => {
    const originalQuery = connection.query;
    
    connection.query = function(...args) {
      const start = Date.now();
      const result = originalQuery.apply(this, args);
      
      result.on('end', () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log queries over 1 second
          console.warn(`Slow query detected: ${duration}ms`, args[0]);
        }
      });
      
      return result;
    };
  });
};
```