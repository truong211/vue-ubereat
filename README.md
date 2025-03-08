# Vue UberEat - Food Delivery Website

A comprehensive food delivery platform built with Vue.js, Node.js, and MySQL.

## Project Overview

This project is a food delivery website that connects restaurants with customers, allowing for online food ordering and delivery tracking. The system serves both restaurants for managing their menus and orders, and customers for ordering food and tracking deliveries.

## Features

### For Restaurants:
- Restaurant registration and profile management
- Menu management (add, edit, delete items)
- Order processing and delivery tracking
- Promotion and discount management
- Customer review monitoring
- Revenue reports and analytics

### For Customers:
- User registration and profile management
- Restaurant browsing and food ordering
- Order tracking
- Food rating and reviews
- Saved delivery addresses and payment methods
- Order history and favorites

## Technology Stack

### Frontend:
- Vue.js 3
- Vuex for state management
- Vue Router for navigation
- Vuetify for UI components
- Axios for API requests
- Socket.io for real-time updates

### Backend:
- Node.js
- Express.js
- MySQL for database
- JWT for authentication
- Socket.io for real-time communication

## Project Structure

```
vue-ubereat/
├── frontend/               # Vue.js frontend application
│   ├── public/             # Static files
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── src/            # Source files
│   │   │   ├── components/     # Reusable Vue components
│   │   │   ├── composables/    # Vue 3 composables
│   │   │   ├── i18n/           # Internationalization
│   │   │   ├── layouts/        # Layout components
│   │   │   ├── router/         # Vue Router configuration
│   │   │   ├── services/       # API and other services
│   │   │   ├── store/          # Vuex store modules
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── validations/    # Form validation rules
│   │   │   ├── views/          # Page components
│   │   │   ├── App.vue         # Root component
│   │   │   └── main.js         # Application entry point
│   │   ├── .env                # Environment variables
│   │   └── package.json        # Dependencies and scripts
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies and scripts
├── backend/                # Node.js backend application
│   ├── src/                # Source files
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Application entry point
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies and scripts
├── food_Delivery.sql       # Database schema
└── setup-database.js       # Database setup script
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vue-ubereat.git
cd vue-ubereat
```

2. Set up the database:
```bash
node setup-database.js
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Implementation Plan

1. **Phase 1: Setup and Authentication**
   - Project structure setup
   - Database configuration
   - User authentication (login, register, forgot password)
   - User profile management

2. **Phase 2: Restaurant Management**
   - Restaurant registration and profile
   - Menu management
   - Category management
   - Food item management

3. **Phase 3: Customer Features**
   - Restaurant browsing and searching
   - Food ordering
   - Cart functionality
   - Checkout process

4. **Phase 4: Order Management**
   - Order processing for restaurants
   - Order tracking for customers
   - Delivery status updates
   - Order history

5. **Phase 5: Reviews and Ratings**
   - Customer reviews
   - Restaurant ratings
   - Food item ratings

6. **Phase 6: Promotions and Discounts**
   - Coupon management
   - Special offers
   - Loyalty programs

7. **Phase 7: Analytics and Reporting**
   - Restaurant sales reports
   - Customer order analytics
   - Performance metrics

8. **Phase 8: Optimization and Deployment**
   - Performance optimization
   - Security enhancements
   - Production deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.
