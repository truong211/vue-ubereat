-- Create database with proper character set
CREATE DATABASE IF NOT EXISTS food_delivery
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE food_delivery;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255),
  fullName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('admin', 'customer', 'restaurant', 'driver') DEFAULT 'customer',
  profileImage VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  lastLogin DATETIME,
  isEmailVerified BOOLEAN DEFAULT FALSE,
  isPhoneVerified BOOLEAN DEFAULT FALSE,
  emailVerificationOtp VARCHAR(10),
  emailVerificationExpires DATETIME,
  phoneVerificationOtp VARCHAR(10),
  phoneVerificationExpires DATETIME,
  resetPasswordOtp VARCHAR(10),
  resetPasswordExpires DATETIME,
  socialProvider ENUM('local', 'google', 'facebook', 'apple') DEFAULT 'local',
  socialId VARCHAR(100),
  socialToken TEXT,
  verificationToken VARCHAR(255),
  verificationExpires DATETIME,
  resetPasswordToken VARCHAR(255),
  preferredLanguage VARCHAR(10) DEFAULT 'vi',
  notificationPreferences JSON,
  favoriteRestaurants JSON,
  favoriteDishes JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(100),
  logo VARCHAR(255),
  coverImage VARCHAR(255),
  openingHours JSON,
  specialHolidays JSON,
  cuisineType VARCHAR(50),
  priceRange ENUM('$', '$$', '$$$', '$$$$'),
  rating DECIMAL(3, 2) DEFAULT 0,
  deliveryFee DECIMAL(10, 2) DEFAULT 0,
  minOrderAmount DECIMAL(10, 2) DEFAULT 0,
  estimatedDeliveryTime INT,
  isActive BOOLEAN DEFAULT TRUE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  displayOrder INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT NOT NULL,
  categoryId INT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discountPrice DECIMAL(10, 2),
  image VARCHAR(255),
  isAvailable BOOLEAN DEFAULT TRUE,
  ingredients TEXT,
  allergens TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  restaurantId INT NOT NULL,
  orderNumber VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
  totalAmount DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  taxAmount DECIMAL(10, 2) DEFAULT 0,
  deliveryFee DECIMAL(10, 2) DEFAULT 0,
  discountAmount DECIMAL(10, 2) DEFAULT 0,
  paymentMethod ENUM('cash', 'credit_card', 'debit_card', 'e_wallet') DEFAULT 'cash',
  paymentStatus ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  deliveryAddress TEXT NOT NULL,
  deliveryInstructions TEXT,
  estimatedDeliveryTime DATETIME,
  actualDeliveryTime DATETIME,
  driverId INT,
  customerNote TEXT,
  restaurantNote TEXT,
  cancellationReason TEXT,
  isRated BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id),
  FOREIGN KEY (driverId) REFERENCES users(id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  productId INT,
  name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unitPrice DECIMAL(10, 2) NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  options JSON,
  notes TEXT,
  isCompleted BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  restaurantId INT NOT NULL,
  orderId INT NOT NULL,
  rating DECIMAL(3, 2) NOT NULL,
  comment TEXT,
  images JSON,
  response TEXT,
  responseDate DATETIME,
  isVisible BOOLEAN DEFAULT TRUE,
  moderationStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  moderationReason TEXT,
  moderatedAt DATETIME,
  moderatedBy INT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (moderatedBy) REFERENCES users(id)
);

-- Create review_votes table
CREATE TABLE IF NOT EXISTS review_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  reviewId INT NOT NULL,
  isHelpful BOOLEAN NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewId) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  addressLine1 VARCHAR(255) NOT NULL,
  addressLine2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  ward VARCHAR(100),
  state VARCHAR(100),
  postalCode VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
  phone VARCHAR(15),
  isDefault BOOLEAN DEFAULT FALSE,
  type ENUM('home', 'work', 'other') DEFAULT 'home',
  instructions TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  placeId VARCHAR(100),
  formattedAddress VARCHAR(255),
  hasElevator BOOLEAN DEFAULT TRUE,
  floor INT,
  apartmentNumber VARCHAR(20),
  deliveryNotes TEXT,
  contactName VARCHAR(100),
  contactPhone VARCHAR(15),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_address_user (userId),
  INDEX idx_address_location (latitude, longitude)
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  options JSON,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_user (userId),
  INDEX idx_cart_product (productId),
  INDEX idx_cart_user_product (userId, productId)
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  itemId INT NOT NULL,
  type ENUM('food', 'restaurant', 'category') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY favorite_user_item_type (userId, itemId, type)
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type ENUM('percentage', 'fixed_amount', 'free_delivery') NOT NULL DEFAULT 'percentage',
  value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_order_amount DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  max_redemptions INT,
  current_redemptions INT DEFAULT 0,
  restaurantId INT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create user_promotions table
CREATE TABLE IF NOT EXISTS user_promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  promotionId INT NOT NULL,
  isUsed BOOLEAN DEFAULT FALSE,
  usedAt DATETIME,
  orderId INT,
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promotionId) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
);

-- Create loyalty table
CREATE TABLE IF NOT EXISTS loyalty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  restaurantId INT,
  points INT NOT NULL DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
  lastPointEarned DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create loyalty_rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  pointsRequired INT NOT NULL,
  rewardType ENUM('discount', 'free_item', 'delivery_fee', 'special_offer') NOT NULL,
  rewardValue DECIMAL(10, 2),
  tier ENUM('bronze', 'silver', 'gold', 'platinum', 'all') DEFAULT 'all',
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- Create loyalty_redemptions table
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  loyaltyId INT NOT NULL,
  rewardId INT NOT NULL,
  pointsSpent INT NOT NULL,
  orderId INT,
  status ENUM('pending', 'applied', 'expired', 'cancelled') DEFAULT 'pending',
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loyaltyId) REFERENCES loyalty(id) ON DELETE CASCADE,
  FOREIGN KEY (rewardId) REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
);

-- Create review_responses table
CREATE TABLE IF NOT EXISTS review_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewId INT NOT NULL,
  restaurantId INT NOT NULL,
  response TEXT NOT NULL,
  respondedBy INT NOT NULL,
  isEdited BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewId) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (respondedBy) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  data JSON,
  isRead BOOLEAN DEFAULT FALSE,
  readAt DATETIME,
  isSystemWide BOOLEAN DEFAULT FALSE,
  validUntil DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_user (userId),
  INDEX idx_notification_type (type)
);

-- Create static_pages table
CREATE TABLE IF NOT EXISTS static_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create delivery_configs table
CREATE TABLE IF NOT EXISTS delivery_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT,
  maxDeliveryDistance DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  minOrderAmountForDelivery DECIMAL(10, 2),
  baseDeliveryFee DECIMAL(10, 2) NOT NULL DEFAULT 15000.00,
  useDistanceBasedFee BOOLEAN DEFAULT TRUE,
  feePerKilometer DECIMAL(10, 2) DEFAULT 5000.00,
  freeDeliveryThreshold DECIMAL(10, 2),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_delivery_restaurant (restaurantId)
);

-- Create site_config table
CREATE TABLE IF NOT EXISTS site_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contactEmail VARCHAR(255),
  supportPhone VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  image VARCHAR(255),
  authorId INT,
  categoryId VARCHAR(100),
  tags JSON,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  viewCount INT DEFAULT 0,
  isPromoted BOOLEAN DEFAULT FALSE,
  publishedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create review_reports table
CREATE TABLE IF NOT EXISTS review_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewId INT NOT NULL,
  userId INT NOT NULL,
  reason ENUM('spam', 'offensive', 'inappropriate', 'false_info', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'actioned', 'dismissed') DEFAULT 'pending',
  moderatorId INT,
  moderatorNote TEXT,
  actionTaken VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewId) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moderatorId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create restaurant_settings table
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT NOT NULL,
  autoAcceptOrders BOOLEAN DEFAULT TRUE,
  preparationTimeMinutes INT DEFAULT 30,
  displayPhoneNumber BOOLEAN DEFAULT TRUE,
  displayAddress BOOLEAN DEFAULT TRUE,
  enableReviews BOOLEAN DEFAULT TRUE,
  enablePromotion BOOLEAN DEFAULT TRUE,
  allowScheduledOrders BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create driver_locations table
CREATE TABLE IF NOT EXISTS driver_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driverId INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading INT,
  locationTimestamp DATETIME NOT NULL,
  isAvailable BOOLEAN DEFAULT TRUE,
  isActive BOOLEAN DEFAULT TRUE,
  deviceInfo JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_driver_location (latitude, longitude),
  INDEX idx_driver_availability (isAvailable, isActive)
);

-- Create order_status_logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  comment TEXT,
  userId INT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create marketing_content table
CREATE TABLE IF NOT EXISTS marketing_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image VARCHAR(255),
  type ENUM('promotion', 'announcement', 'newsletter', 'event') NOT NULL,
  startDate DATETIME,
  endDate DATETIME,
  targetAudience JSON,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  createdBy INT,
  priority INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  link VARCHAR(255),
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  position VARCHAR(50) DEFAULT 'home_top',
  priority INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  clickCount INT DEFAULT 0,
  impressionCount INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  isActive BOOLEAN DEFAULT TRUE,
  displayOrder INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create staff_permissions table
CREATE TABLE IF NOT EXISTS staff_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  restaurantId INT NOT NULL,
  role ENUM('manager', 'staff', 'kitchen', 'cashier', 'waiter') NOT NULL,
  permissions JSON,
  isActive BOOLEAN DEFAULT TRUE,
  createdBy INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES users(id),
  UNIQUE KEY staff_restaurant_unique (userId, restaurantId)
);

-- Create delivery_fee_tiers table
CREATE TABLE IF NOT EXISTS delivery_fee_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deliveryConfigId INT NOT NULL,
  minDistance DECIMAL(5, 2) NOT NULL,
  maxDistance DECIMAL(5, 2) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL,
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (deliveryConfigId) REFERENCES delivery_configs(id) ON DELETE CASCADE
);

-- Create notification_tracking table
CREATE TABLE IF NOT EXISTS notification_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notificationId INT NOT NULL,
  actionType VARCHAR(50) NOT NULL,
  actionTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deviceInfo JSON,
  ipAddress VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Create promotion_categories table
CREATE TABLE IF NOT EXISTS promotion_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create promotion_campaigns table
CREATE TABLE IF NOT EXISTS promotion_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  budget DECIMAL(10, 2),
  status ENUM('draft', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
  targetAudience JSON,
  metrics JSON,
  createdBy INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Create api_performance_logs table
CREATE TABLE IF NOT EXISTS api_performance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  responseTime INT NOT NULL,
  statusCode INT NOT NULL,
  requestIP VARCHAR(50),
  userId INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON,
  ipAddress VARCHAR(50),
  userAgent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  userId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paymentMethod VARCHAR(50) NOT NULL,
  transactionId VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
  paymentDetails JSON,
  refundAmount DECIMAL(10, 2) DEFAULT 0,
  refundReason TEXT,
  refundDate DATETIME,
  gatewayResponse JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create product_promotions table
CREATE TABLE IF NOT EXISTS product_promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  promotionId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (promotionId) REFERENCES promotions(id) ON DELETE CASCADE
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurantId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  image VARCHAR(255),
  isAvailable BOOLEAN DEFAULT TRUE,
  options JSON,
  nutritionInfo JSON,
  isVegetarian BOOLEAN DEFAULT FALSE,
  isVegan BOOLEAN DEFAULT FALSE,
  isGlutenFree BOOLEAN DEFAULT FALSE,
  spicyLevel INT DEFAULT 0,
  preparationTime INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create order_details table
CREATE TABLE IF NOT EXISTS order_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  deliveryTime INT,
  orderNotes TEXT,
  paymentDetails JSON,
  specialInstructions TEXT,
  giftWrapping BOOLEAN DEFAULT FALSE,
  giftMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert admin user
INSERT INTO users (username, email, password, fullName, role, isActive, isEmailVerified)
VALUES ('admin', 'admin@fooddelivery.com', '$2a$10$5i8F2VW9AW6JpOnYtDm0aO6OmvYt8PKa3h0dzTFztp/aw9OXqj3lG', 'System Administrator', 'admin', TRUE, TRUE);

-- Add initial site configuration
INSERT INTO site_config (name, description, contactEmail, supportPhone)
VALUES ('Food Delivery', 'Online food delivery platform', 'support@fooddelivery.com', '+84123456789');

-- Create indexes for frequent queries to improve performance
CREATE INDEX idx_product_restaurant ON products(restaurantId);
CREATE INDEX idx_product_category ON products(categoryId);
CREATE INDEX idx_order_user ON orders(userId);
CREATE INDEX idx_order_restaurant ON orders(restaurantId);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_payment ON orders(paymentStatus);
CREATE INDEX idx_review_restaurant ON reviews(restaurantId);
CREATE INDEX idx_review_rating ON reviews(rating);
CREATE INDEX idx_promotion_code ON promotions(code);
CREATE INDEX idx_promotion_date ON promotions(start_date, end_date);
CREATE INDEX idx_loyalty_user ON loyalty(userId);
CREATE INDEX idx_notification_read ON notifications(isRead);

-- Insert test data for users (add this at the end of the file)
INSERT INTO users (username, email, password, fullName, phone, role, profileImage, isActive, createdAt, updatedAt) 
VALUES 
('admin', 'admin@example.com', '$2a$10$YdMD8aXA9YZl1E.XtKC4/.fFdL8L16QlSVN3mnnF.pUWziyMxpBAO', 'Admin User', '1234567890', 'admin', NULL, 1, NOW(), NOW()),
('customer1', 'customer1@example.com', '$2a$10$YdMD8aXA9YZl1E.XtKC4/.fFdL8L16QlSVN3mnnF.pUWziyMxpBAO', 'Customer One', '0987654321', 'customer', NULL, 1, NOW(), NOW()),
('restaurant1', 'restaurant1@example.com', '$2a$10$YdMD8aXA9YZl1E.XtKC4/.fFdL8L16QlSVN3mnnF.pUWziyMxpBAO', 'Restaurant One', '5556667777', 'restaurant', NULL, 1, NOW(), NOW()),
('driver1', 'driver1@example.com', '$2a$10$YdMD8aXA9YZl1E.XtKC4/.fFdL8L16QlSVN3mnnF.pUWziyMxpBAO', 'Driver One', '1112223333', 'driver', NULL, 1, NOW(), NOW());
-- Password for all accounts is 'password123'