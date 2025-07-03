-- Cart Migration Script
-- This script fixes the cart table to support multiple items with different options
-- and adds performance indexes for the cart and ordering system

USE food_delivery;

-- Remove the unique constraint that prevents same product with different options
ALTER TABLE cart DROP INDEX IF EXISTS cart_user_product;

-- Add performance indexes for cart operations
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(userId);
CREATE INDEX IF NOT EXISTS idx_cart_product ON cart(productId);
CREATE INDEX IF NOT EXISTS idx_cart_user_product ON cart(userId, productId);

-- Add missing product_options tables if they don't exist
CREATE TABLE IF NOT EXISTS product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('single', 'multiple') DEFAULT 'single',
  required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_options_product (product_id)
);

-- Add product option choices table
CREATE TABLE IF NOT EXISTS product_option_choices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  option_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE,
  INDEX idx_option_choices_option (option_id)
);

-- Add session storage table for cart state
CREATE TABLE IF NOT EXISTS cart_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_data JSON,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cart_sessions_user (user_id),
  INDEX idx_cart_sessions_expires (expires_at)
);

-- Ensure promotions table has all required fields
ALTER TABLE promotions 
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10,2) AFTER max_discount,
ADD COLUMN IF NOT EXISTS applicable_restaurant_ids JSON AFTER restaurantId,
ADD COLUMN IF NOT EXISTS applicable_categories JSON AFTER applicable_restaurant_ids,
ADD COLUMN IF NOT EXISTS usage_limit_per_user INT DEFAULT NULL AFTER max_redemptions;

-- Add performance indexes for promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(isActive, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant ON promotions(restaurantId);

-- Add order tracking improvements
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS special_instructions TEXT AFTER deliveryInstructions,
ADD COLUMN IF NOT EXISTS scheduled_delivery_time DATETIME AFTER estimatedDeliveryTime,
ADD COLUMN IF NOT EXISTS applied_promotion_id INT AFTER discountAmount,
ADD COLUMN IF NOT EXISTS delivery_address_id INT AFTER deliveryAddress;

-- Add foreign key for applied promotion
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS fk_orders_promotion 
FOREIGN KEY (applied_promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

-- Add foreign key for delivery address
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS fk_orders_address 
FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) ON DELETE SET NULL;

-- Performance indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(scheduled_delivery_time);
CREATE INDEX IF NOT EXISTS idx_orders_promotion ON orders(applied_promotion_id);
CREATE INDEX IF NOT EXISTS idx_orders_address ON orders(delivery_address_id);

-- Add user promotion usage tracking
CREATE TABLE IF NOT EXISTS user_promotion_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  promotion_id INT NOT NULL,
  usage_count INT DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_promotion (user_id, promotion_id)
);

-- Sample data for testing product options
INSERT IGNORE INTO product_options (product_id, name, type, required, display_order) VALUES
(1, 'Size', 'single', true, 1),
(1, 'Toppings', 'multiple', false, 2),
(2, 'Size', 'single', true, 1),
(3, 'Spice Level', 'single', false, 1);

INSERT IGNORE INTO product_option_choices (option_id, name, price, display_order) VALUES
-- Size options for product 1
(1, 'Small', 0.00, 1),
(1, 'Medium', 2.50, 2),
(1, 'Large', 5.00, 3),
-- Toppings for product 1
(2, 'Extra Cheese', 1.50, 1),
(2, 'Mushrooms', 1.00, 2),
(2, 'Pepperoni', 2.00, 3),
(2, 'Olives', 1.00, 4),
-- Size options for product 2
(3, 'Regular', 0.00, 1),
(3, 'Large', 3.00, 2),
-- Spice level for product 3
(4, 'Mild', 0.00, 1),
(4, 'Medium', 0.00, 2),
(4, 'Hot', 0.00, 3),
(4, 'Extra Hot', 0.50, 4);

-- Sample promotions for testing
INSERT IGNORE INTO promotions (code, name, description, type, value, min_order_amount, max_discount_amount, start_date, end_date, max_redemptions) VALUES
('WELCOME10', 'Welcome Discount', '10% off for new customers', 'percentage', 10.00, 50000.00, 20000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1000),
('SAVE20K', 'Save 20K', '20,000 VND off orders over 100K', 'fixed_amount', 20000.00, 100000.00, 20000.00, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 500),
('FREEDEL', 'Free Delivery', 'Free delivery on any order', 'free_delivery', 0.00, 0.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 200);

COMMIT;