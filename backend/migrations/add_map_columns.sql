-- Migration script for map integration features
-- Run this script to add required columns for location and mapping functionality

-- Add location columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT 1,
ADD COLUMN IF NOT EXISTS delivery_radius INT DEFAULT 10; -- in kilometers

-- Add location columns to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8) NULL,
ADD COLUMN IF NOT EXISTS heading DECIMAL(5, 2) NULL, -- 0-360 degrees
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT 0,
ADD COLUMN IF NOT EXISTS vehicle_type ENUM('bike', 'motorbike', 'car', 'truck') DEFAULT 'motorbike';

-- Add delivery location columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8) NULL,
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8) NULL,
ADD COLUMN IF NOT EXISTS delivery_address TEXT NULL,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT NULL,
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS delivery_distance DECIMAL(8, 2) NULL, -- in kilometers
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(8, 2) DEFAULT 0.00;

-- Create delivery_tracking table for real-time tracking
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2) NULL,
    speed DECIMAL(5, 2) NULL, -- km/h
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Create spatial indexes for better performance on location queries
-- Note: These require MyISAM or InnoDB with spatial support
CREATE INDEX idx_restaurant_location ON restaurants (latitude, longitude);
CREATE INDEX idx_driver_location ON drivers (current_latitude, current_longitude);
CREATE INDEX idx_order_delivery_location ON orders (delivery_latitude, delivery_longitude);

-- Add some sample location data for testing (Vietnam coordinates)
-- Update sample restaurants with Hanoi locations
UPDATE restaurants SET 
    latitude = 21.0285 + (RAND() - 0.5) * 0.1,
    longitude = 105.8542 + (RAND() - 0.5) * 0.1,
    active = 1,
    delivery_radius = 5 + FLOOR(RAND() * 10)
WHERE latitude IS NULL;

-- Update sample drivers with initial locations in Hanoi area
UPDATE drivers SET 
    current_latitude = 21.0285 + (RAND() - 0.5) * 0.1,
    current_longitude = 105.8542 + (RAND() - 0.5) * 0.1,
    is_active = 1,
    vehicle_type = ELT(1 + FLOOR(RAND() * 4), 'bike', 'motorbike', 'car', 'truck')
WHERE current_latitude IS NULL;

-- Update sample orders with delivery locations
UPDATE orders SET 
    delivery_latitude = 21.0285 + (RAND() - 0.5) * 0.1,
    delivery_longitude = 105.8542 + (RAND() - 0.5) * 0.1,
    delivery_address = CONCAT('Sample Address ', id, ', Hanoi, Vietnam'),
    delivery_distance = 1 + RAND() * 15,
    delivery_fee = 2.99 + (RAND() * 5)
WHERE delivery_latitude IS NULL;

-- Create a view for active drivers with their current locations
CREATE OR REPLACE VIEW active_drivers_with_location AS
SELECT 
    d.id,
    d.name,
    d.phone,
    d.current_latitude,
    d.current_longitude,
    d.heading,
    d.location_updated_at,
    d.vehicle_type,
    d.is_active,
    CASE 
        WHEN d.location_updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'online'
        WHEN d.location_updated_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 'away'
        ELSE 'offline'
    END as status
FROM drivers d
WHERE d.is_active = 1
    AND d.current_latitude IS NOT NULL 
    AND d.current_longitude IS NOT NULL;

-- Create a view for orders with complete location information
CREATE OR REPLACE VIEW orders_with_locations AS
SELECT 
    o.*,
    r.name as restaurant_name,
    r.latitude as restaurant_latitude,
    r.longitude as restaurant_longitude,
    r.address as restaurant_address,
    d.name as driver_name,
    d.current_latitude as driver_latitude,
    d.current_longitude as driver_longitude,
    d.vehicle_type as driver_vehicle_type
FROM orders o
LEFT JOIN restaurants r ON o.restaurant_id = r.id
LEFT JOIN drivers d ON o.driver_id = d.id;

-- Insert some sample tracking data for active orders
INSERT INTO delivery_tracking (order_id, driver_id, latitude, longitude, heading, speed)
SELECT 
    o.id,
    o.driver_id,
    d.current_latitude + (RAND() - 0.5) * 0.01,
    d.current_longitude + (RAND() - 0.5) * 0.01,
    RAND() * 360,
    20 + RAND() * 40
FROM orders o
JOIN drivers d ON o.driver_id = d.id
WHERE o.status IN ('pickup', 'delivering') 
    AND o.driver_id IS NOT NULL
    AND d.current_latitude IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM delivery_tracking dt 
        WHERE dt.order_id = o.id 
        AND dt.timestamp > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    )
LIMIT 10;

COMMIT;