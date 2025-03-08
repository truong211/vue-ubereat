CREATE DATABASE IF NOT EXISTS food_delivery;

USE food_delivery;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Restaurants table
CREATE TABLE restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(15),
    description TEXT,
    image_url VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    status ENUM('available', 'unavailable') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('cash', 'credit_card', 'e_wallet') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Order Details table
CREATE TABLE order_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create Promotions table
CREATE TABLE promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    min_order_value DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Product Promotions table (Many-to-Many relationship)
CREATE TABLE product_promotions (
    product_id INT,
    promotion_id INT,
    PRIMARY KEY (product_id, promotion_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

-- Create Cart table
CREATE TABLE cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    product_id INT,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create Reviews table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    order_id INT,
    product_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert sample users with simple plaintext passwords
INSERT INTO users (username, password, email, full_name, phone, address, role) VALUES
('john_doe', 'password123', 'john@example.com', 'John Doe', '+1234567890', '123 Main St, City', 'customer'),
('admin_user', 'admin123', 'admin@system.com', 'Admin User', '+9876543210', '456 Admin St, City', 'admin'),
('alice_smith', 'alice123', 'alice@example.com', 'Alice Smith', '+1122334455', '789 Oak St, City', 'customer'),
('bob_wilson', 'bob123', 'bob@example.com', 'Bob Wilson', NULL, NULL, 'customer'),
('emma_davis', 'emma123', 'emma@example.com', 'Emma Davis', '+5544332211', '321 Pine St, City', 'customer'),
('support_team', 'support123', 'support@system.com', 'Support Team', '+9988776655', '654 Support St, City', 'admin'),
('james_brown', 'james123', 'james@example.com', 'James Brown', '+1234567891', '987 Elm St, City', 'customer'),
('sarah_lee', 'sarah123', 'sarah@example.com', 'Sarah Lee', '', '147 Maple St, City', 'customer'),
('david_wang', 'david123', 'david@example.com', 'David Wang', '+9876543211', NULL, 'customer'),
('mary_johnson', 'mary123', 'mary@example.com', 'Mary Johnson', '+5544332212', '258 Cedar St, City', 'customer');

-- Rest of the INSERT statements remain the same as before
-- Insert sample restaurants
INSERT INTO restaurants (name, address, phone, description, image_url, rating, status) VALUES
('Tasty Burger', '123 Food St, City', '+1234567890', 'Best burgers in town', 'burger.jpg', 4.5, 'active'),
('Pizza Palace', '456 Pizza Ave, City', '+9876543210', 'Authentic Italian pizza', 'pizza.jpg', 4.8, 'active'),
('Sushi Master', '789 Japanese St, City', '+1122334455', 'Fresh sushi and sashimi', 'sushi.jpg', 4.2, 'active'),
('Closed Restaurant', '321 Closed St, City', '+5544332211', 'Temporarily closed', 'closed.jpg', 3.5, 'inactive'),
('Spice Garden', '654 Indian St, City', NULL, 'Authentic Indian cuisine', NULL, 4.0, 'active'),
('Noodle House', '987 Asian St, City', '+9988776655', 'Various Asian noodles', 'noodles.jpg', 4.6, 'active'),
('Mexican Grill', '147 Taco St, City', '+1234567891', 'Authentic Mexican food', 'mexican.jpg', 0.0, 'active'),
('Sweet Tooth', '258 Dessert St, City', '+9876543211', 'Desserts and pastries', 'dessert.jpg', 4.7, 'active'),
('Veggie Delight', '369 Green St, City', '+5544332212', 'Vegetarian specialties', 'veggie.jpg', 4.1, 'active'),
('Fast Food Joint', '741 Quick St, City', '+1122334456', 'Quick and tasty meals', 'fastfood.jpg', 3.8, 'active');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Burgers', 'Delicious beef and chicken burgers'),
('Pizza', 'Various pizza styles and toppings'),
('Sushi', 'Fresh Japanese sushi and rolls'),
('Desserts', 'Sweet treats and pastries'),
('Beverages', 'Soft drinks and refreshments'),
('Appetizers', 'Starters and small plates'),
('Main Course', 'Principal dishes'),
('Salads', 'Fresh and healthy salads'),
('Soups', 'Hot and cold soups'),
('Special Items', NULL);

-- Insert sample products
INSERT INTO products (restaurant_id, category_id, name, description, price, image_url, status) VALUES
(1, 1, 'Classic Burger', 'Beef patty with lettuce and tomato', 9.99, 'classic_burger.jpg', 'available'),
(2, 2, 'Margherita Pizza', 'Classic tomato and mozzarella', 14.99, 'margherita.jpg', 'available'),
(3, 3, 'California Roll', 'Crab, avocado, cucumber', 12.99, 'california_roll.jpg', 'available'),
(4, 1, 'Unavailable Burger', 'Temporarily unavailable', 11.99, 'unavailable.jpg', 'unavailable'),
(5, 7, 'Butter Chicken', 'Creamy Indian curry', 16.99, NULL, 'available'),
(6, 7, 'Pad Thai', 'Thai style noodles', 13.99, 'padthai.jpg', 'available'),
(7, 6, 'Nachos', 'Tortilla chips with toppings', 8.99, 'nachos.jpg', 'available'),
(8, 4, 'Chocolate Cake', 'Rich chocolate layer cake', 7.99, 'chocolate_cake.jpg', 'available'),
(9, 8, 'Garden Salad', 'Fresh mixed vegetables', 6.99, 'salad.jpg', 'available'),
(10, 5, 'Fresh Lemonade', 'Homemade lemonade', 3.99, 'lemonade.jpg', 'available');

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status, payment_method, payment_status, delivery_address) VALUES
(1, 29.99, 'delivered', 'credit_card', 'paid', '123 Main St, City'),
(2, 45.99, 'pending', 'cash', 'pending', '456 Admin St, City'),
(3, 32.99, 'preparing', 'e_wallet', 'paid', '789 Oak St, City'),
(4, 15.99, 'cancelled', 'credit_card', 'failed', 'Invalid Address'),
(5, 25.99, 'delivering', 'cash', 'pending', '321 Pine St, City'),
(6, 55.99, 'confirmed', 'e_wallet', 'paid', '654 Support St, City'),
(7, 42.99, 'delivered', 'credit_card', 'paid', '987 Elm St, City'),
(8, 18.99, 'pending', 'cash', 'pending', '147 Maple St, City'),
(9, 22.99, 'cancelled', 'credit_card', 'failed', 'No Address Provided'),
(10, 33.99, 'delivered', 'e_wallet', 'paid', '258 Cedar St, City');

-- Insert sample order details
INSERT INTO order_details (order_id, product_id, quantity, price, notes) VALUES
(1, 1, 2, 19.98, 'Extra cheese'),
(1, 5, 1, 16.99, NULL),
(2, 2, 3, 44.97, 'Well done'),
(3, 3, 2, 25.98, 'No wasabi'),
(4, 4, 1, 11.99, 'Cancelled order'),
(5, 6, 2, 27.98, 'Spicy'),
(6, 7, 4, 35.96, 'Extra sauce'),
(7, 8, 3, 23.97, 'Birthday message'),
(8, 9, 2, 13.98, 'No dressing'),
(9, 10, 3, 11.97, 'With ice');

-- Insert sample promotions
INSERT INTO promotions (code, description, discount_type, discount_value, start_date, end_date, min_order_value, max_discount, status) VALUES
('WELCOME10', 'Welcome discount', 'percentage', 10.00, '2024-01-01', '2024-12-31', 20.00, 50.00, 'active'),
('SUMMER25', 'Summer sale', 'percentage', 25.00, '2024-06-01', '2024-08-31', 30.00, 100.00, 'inactive'),
('FLAT5', 'Flat discount', 'fixed_amount', 5.00, '2024-02-01', '2024-02-28', NULL, NULL, 'active'),
('SPECIAL50', 'Special discount', 'percentage', 50.00, '2024-03-01', '2024-03-07', 100.00, 200.00, 'active'),
('INVALID', 'Invalid promotion', 'percentage', 0.00, '2024-01-01', '2023-12-31', 0.00, 0.00, 'inactive'),
('FREE10', 'Free delivery', 'fixed_amount', 10.00, '2024-04-01', '2024-04-30', 25.00, 10.00, 'active'),
('HOLIDAY20', 'Holiday special', 'percentage', 20.00, '2024-12-24', '2024-12-26', 50.00, 150.00, 'active'),
('WEEKEND15', 'Weekend offer', 'percentage', 15.00, '2024-01-01', '2024-12-31', 40.00, 75.00, 'active'),
('FLASH30', 'Flash sale', 'percentage', 30.00, '2024-05-01', '2024-05-02', 60.00, 120.00, 'active'),
('NEWUSER', 'New user discount', 'percentage', 20.00, '2024-01-01', '2024-12-31', 15.00, 40.00, 'active');

-- Insert sample product promotions
INSERT INTO product_promotions (product_id, promotion_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 3),
(5, 4),
(6, 5),
(7, 6),
(8, 7),
(9, 8),
(10, 9);

-- Insert sample cart items
INSERT INTO cart (user_id, product_id, quantity) VALUES
(1, 1, 2),
(2, 2, 1),
(3, 3, 3),
(4, 4, 1),
(5, 5, 2),
(6, 6, 1),
(7, 7, 4),
(8, 8, 2),
(9, 9, 1),
(10, 10, 3);

-- Insert sample reviews
INSERT INTO reviews (user_id, order_id, product_id, rating, comment) VALUES
(1, 1, 1, 5, 'Excellent burger!'),
(2, 2, 2, 4, 'Good pizza, but a bit pricey'),
(3, 3, 3, 5, 'Fresh and delicious'),
(4, 4, 4, 1, 'Order was cancelled'),
(5, 5, 5, 4, 'Tasty but spicy'),
(6, 6, 6, 5, 'Best noodles ever'),
(7, 7, 7, 3, 'Average taste'),
(8, 8, 8, 5, 'Perfect dessert'),
(9, 9, 9, 2, 'Not fresh enough'),
(10, 10, 10, 4, 'Refreshing drink');
