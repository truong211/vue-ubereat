# Food Delivery Application - Setup and Usage Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Starting the Application](#starting-the-application)
6. [User Roles and Features](#user-roles-and-features)
7. [Development Workflow](#development-workflow)
8. [API Usage Examples](#api-usage-examples)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: 18.0 or higher
- **MySQL**: 8.0 or higher
- **NPM or Yarn**: Latest version
- **Git**: For version control

### External Services (Optional)

- **Google Maps API**: For location services
- **Stripe Account**: For payment processing
- **Firebase Account**: For push notifications
- **SMTP Server**: For email notifications

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd food-delivery-app
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Install Root Dependencies (if any)

```bash
cd ..
npm install
```

---

## Configuration

### 1. Backend Environment Variables

Create `.env` file in the backend directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_delivery

# Application Settings
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your_session_secret_key

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Payment Configuration (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Firebase Configuration (Optional)
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/firebase-service-account.json
FIREBASE_PROJECT_ID=your_firebase_project_id

# Social Auth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### 2. Frontend Environment Variables

Create `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase (Optional)
VITE_USE_FIREBASE=true
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Payment Configuration (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Social Auth (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id

# App Configuration
VITE_APP_NAME=Food Delivery App
VITE_APP_VERSION=1.0.0
```

---

## Database Setup

### 1. Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE food_delivery;
EXIT;
```

### 2. Import Database Schema

```bash
mysql -u root -p food_delivery < food_Delivery.sql
```

### 3. Run Database Setup Script

```bash
node setup-database.js
```

### 4. Test Database Connection

```bash
node test-db-connection.js
```

Expected output:
```
Database connection test passed!
✓ Connected to MySQL
✓ Database 'food_delivery' exists
✓ All required tables present
```

---

## Starting the Application

### Development Mode

#### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

#### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

#### 1. Build Frontend

```bash
cd frontend
npm run build
```

#### 2. Start Backend in Production Mode

```bash
cd backend
npm start
```

---

## User Roles and Features

### Customer Features

#### Account Management
- **Registration/Login**: Email, Google, Facebook authentication
- **Profile Management**: Update personal information, avatar
- **Address Book**: Manage multiple delivery addresses
- **Order History**: View past orders and reorder

#### Restaurant Discovery
- **Browse Restaurants**: Filter by cuisine, rating, distance
- **Search**: Find restaurants and dishes
- **Restaurant Details**: View menus, reviews, operating hours
- **Favorites**: Save favorite restaurants

#### Ordering Process
- **Menu Browsing**: View categories and items
- **Customization**: Select options (size, toppings, etc.)
- **Cart Management**: Add, remove, modify items
- **Checkout**: Choose address, payment method
- **Order Tracking**: Real-time status updates

#### Payment Options
- Credit/Debit Cards (Stripe)
- PayPal
- Apple Pay / Google Pay
- Cash on Delivery

### Restaurant Owner Features

#### Restaurant Management
- **Profile Setup**: Restaurant information, images, hours
- **Menu Management**: Add/edit categories and items
- **Order Management**: Accept, prepare, track orders
- **Analytics**: Sales reports, popular items

#### Dashboard Access
```
http://localhost:5173/restaurant/dashboard
```

### Driver Features

#### Delivery Management
- **Available Orders**: View and accept delivery requests
- **Navigation**: GPS directions to pickup and delivery
- **Status Updates**: Update order status in real-time
- **Earnings**: Track delivery earnings and tips

### Admin Features

#### System Management
- **User Management**: Manage customers, restaurant owners, drivers
- **Restaurant Approval**: Approve/reject restaurant applications
- **Order Monitoring**: View all system orders
- **Analytics Dashboard**: System-wide statistics

#### Admin Access
```
http://localhost:5173/admin
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

---

## Development Workflow

### Code Structure

```
food-delivery-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and app configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication, validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── socket/          # WebSocket handlers
│   ├── uploads/             # File uploads
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Vuex store
│   │   ├── router/          # Vue Router
│   │   └── assets/          # Static assets
│   └── package.json
└── docs/                    # Documentation
```

### Adding New Features

#### 1. Backend API Endpoint

```javascript
// backend/routes/example.routes.js
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/example.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/', exampleController.getAll);
router.post('/', authMiddleware, exampleController.create);

module.exports = router;
```

#### 2. Frontend Component

```vue
<!-- frontend/src/components/ExampleComponent.vue -->
<template>
  <div class="example-component">
    <h2>{{ title }}</h2>
    <button @click="handleClick">Click Me</button>
  </div>
</template>

<script>
import { ref } from 'vue'
import { apiClient } from '@/services/api.service'

export default {
  name: 'ExampleComponent',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  setup() {
    const data = ref([])
    
    const handleClick = async () => {
      try {
        const response = await apiClient.get('/example')
        data.value = response.data
      } catch (error) {
        console.error('Error:', error)
      }
    }
    
    return {
      handleClick
    }
  }
}
</script>
```

### Database Migrations

When adding new tables or columns:

```javascript
// migration script example
const { query } = require('./backend/src/config/database');

const addNewColumn = async () => {
  try {
    await query(`
      ALTER TABLE users 
      ADD COLUMN newField VARCHAR(255) DEFAULT NULL
    `);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

addNewColumn();
```

---

## API Usage Examples

### Authentication

```javascript
// Register new user
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'customer'
  })
});

const data = await response.json();
const token = data.data.token;
```

### Making Authenticated Requests

```javascript
// Get user profile
const response = await fetch('http://localhost:3001/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const profile = await response.json();
```

### Creating an Order

```javascript
const orderData = {
  restaurantId: 1,
  items: [
    {
      menuItemId: 123,
      quantity: 2,
      options: [
        { name: "Size", choice: "Large", price: 3.00 }
      ]
    }
  ],
  deliveryAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    latitude: 40.7128,
    longitude: -74.0060
  },
  paymentMethod: "credit_card",
  totalAmount: 36.31
};

const response = await fetch('http://localhost:3001/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});
```

---

## Deployment

### Docker Deployment

#### 1. Create Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: food_delivery_db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: food_delivery
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./food_Delivery.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: ./backend
    container_name: food_delivery_backend
    depends_on:
      - mysql
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=rootpassword
      - DB_NAME=food_delivery
    ports:
      - "3001:3001"
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    container_name: food_delivery_frontend
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  mysql_data:
```

#### 2. Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

#### 3. Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 4. Deploy with Docker Compose

```bash
docker-compose up -d
```

### Traditional Server Deployment

#### 1. Setup Production Server

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt update
sudo apt install mysql-server

# Install PM2 for process management
npm install -g pm2
```

#### 2. Deploy Application

```bash
# Upload files to server
scp -r . user@server:/var/www/food-delivery-app

# Setup backend
cd /var/www/food-delivery-app/backend
npm ci --production

# Build and deploy frontend
cd ../frontend
npm ci
npm run build

# Copy built files to web server
sudo cp -r dist/* /var/www/html/
```

#### 3. Start with PM2

```bash
cd /var/www/food-delivery-app/backend
pm2 start src/app.js --name "food-delivery-backend"
pm2 startup
pm2 save
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `ER_ACCESS_DENIED_ERROR: Access denied for user`

**Solution**:
```bash
# Reset MySQL password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

#### 2. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find process using port
lsof -ti:3001

# Kill process
kill -9 <process_id>

# Or use different port
PORT=3002 npm run dev
```

#### 3. Frontend Build Errors

**Error**: `Module not found` or build failures

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm audit fix
```

#### 4. CORS Issues

**Error**: `Access to fetch blocked by CORS policy`

**Solution**:
Update `CORS_ORIGIN` in backend `.env`:
```bash
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

#### 5. JWT Token Issues

**Error**: `JsonWebTokenError: invalid signature`

**Solution**:
1. Clear browser storage and cookies
2. Generate new JWT secret
3. Restart backend server

#### 6. File Upload Issues

**Error**: File uploads failing

**Solution**:
```bash
# Create uploads directory
mkdir -p backend/uploads
chmod 755 backend/uploads

# Check file size limits in .env
MAX_FILE_SIZE=5242880
```

### Debugging

#### Backend Debugging

```bash
# Enable debug mode
DEBUG=* npm run dev

# View logs
tail -f logs/app.log

# Database query logging
# Add to database config:
# logging: console.log
```

#### Frontend Debugging

```bash
# Vue DevTools
# Install Vue DevTools browser extension

# Enable debug mode
VITE_DEBUG=true npm run dev

# Check network requests in browser DevTools
```

### Performance Monitoring

#### Monitor Database

```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Check table sizes
SELECT 
  table_name AS "Table",
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'food_delivery'
ORDER BY (data_length + index_length) DESC;
```

#### Monitor Node.js

```bash
# PM2 monitoring
pm2 monit

# Check memory usage
pm2 list
```

---

## Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### API Testing with Postman

Import the provided Postman collection from `docs/api-collection.json` for testing all API endpoints.

---

## Support and Documentation

- **API Documentation**: See `docs/API_DOCUMENTATION.md`
- **Component Documentation**: See `docs/FRONTEND_COMPONENTS.md`
- **Database Schema**: See `docs/DATABASE_MODELS.md`
- **Services Documentation**: See `docs/SERVICES_DOCUMENTATION.md`

For additional support, check the troubleshooting section or refer to the individual documentation files for specific features.