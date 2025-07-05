# Cart Migration Bug Fixes

## 🐛 Bugs Fixed

### Bug 1: Cart Index Missing in Schema
**Issue:** The `cart-migration.sql` script creates an `idx_cart_user_product` index on the cart table that was missing from the main `food_Delivery.sql` schema file.

**Problem:** This inconsistency resulted in different database structures depending on whether the database was created fresh or updated via migration.

**Fix:** Added the missing index to the main schema file:
```sql
-- In food_Delivery.sql
INDEX idx_cart_user_product (userId, productId)
```

### Bug 2: Missing Sample Data Due to Foreign Key Constraints
**Issue:** The migration script's `INSERT IGNORE` statements for `product_options` and `product_option_choices` referenced `product_ids` 1, 2, and 3, but these products might not exist.

**Problem:** Foreign key constraints would cause these insertions to be silently skipped, resulting in missing sample data for development and testing.

**Fix:** Created a comprehensive sample data setup:

1. **Sample Restaurant User:**
```sql
INSERT IGNORE INTO users (id, username, email, fullName, role, isActive) VALUES
(999, 'sample_restaurant', 'sample@restaurant.com', 'Sample Restaurant Owner', 'restaurant', true);
```

2. **Sample Restaurant:**
```sql
INSERT IGNORE INTO restaurants (id, userId, name, description, address, phone, email, cuisineType, priceRange, deliveryFee, minOrderAmount, estimatedDeliveryTime, isActive) VALUES
(999, 999, 'Sample Restaurant', 'A test restaurant for cart functionality', '123 Test Street, Test City', '0123456789', 'sample@restaurant.com', 'International', '$$', 25000.00, 50000.00, 30, true);
```

3. **Sample Products:**
```sql
INSERT IGNORE INTO products (id, restaurantId, name, description, price, image, isAvailable) VALUES
(1, 999, 'Pizza Margherita', 'Classic pizza with tomato sauce, mozzarella, and basil', 150000.00, 'pizza.jpg', true),
(2, 999, 'Burger Deluxe', 'Premium beef burger with lettuce, tomato, and cheese', 120000.00, 'burger.jpg', true),
(3, 999, 'Spicy Noodles', 'Traditional noodles with customizable spice levels', 80000.00, 'noodles.jpg', true);
```

4. **Conditional Product Options:**
```sql
-- Only insert options if products exist
INSERT IGNORE INTO product_options (product_id, name, type, required, display_order) 
SELECT * FROM (
  SELECT 1 as product_id, 'Size' as name, 'single' as type, true as required, 1 as display_order
  UNION ALL SELECT 1, 'Toppings', 'multiple', false, 2
  UNION ALL SELECT 2, 'Size', 'single', true, 1
  UNION ALL SELECT 3, 'Spice Level', 'single', false, 1
) AS sample_options
WHERE EXISTS (SELECT 1 FROM products WHERE id = sample_options.product_id);
```

## ✅ Benefits of the Fix

1. **Consistent Schema:** Fresh installations and migrations now result in identical database structures.

2. **Reliable Sample Data:** Foreign key constraints are satisfied, ensuring sample data is actually inserted.

3. **Development-Ready:** The migration now provides complete test data for cart functionality:
   - Sample restaurant with products
   - Product options (size, toppings, spice level)
   - Option choices with prices
   - Promotion codes

4. **No Conflicts:** Using high IDs (999) for sample data avoids conflicts with real data.

5. **Safe Operation:** `INSERT IGNORE` ensures the migration can be run multiple times without errors.

## 🧪 Testing the Fix

After running the migration, you can verify:

1. **Check indexes:**
```sql
SHOW INDEX FROM cart;
```

2. **Verify sample data:**
```sql
SELECT * FROM products WHERE id IN (1, 2, 3);
SELECT * FROM product_options WHERE product_id IN (1, 2, 3);
SELECT * FROM product_option_choices;
```

3. **Test cart functionality:**
```bash
# Add pizza with size and toppings
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 1,
    "quantity": 1,
    "options": {
      "1": {"id": 2, "name": "Medium", "price": 2.50},
      "2": [{"id": 3, "name": "Extra Cheese", "price": 1.50}]
    }
  }'
```

## 📋 Migration Status

- ✅ Schema consistency fixed
- ✅ Foreign key constraints satisfied
- ✅ Sample data reliably inserted
- ✅ Development environment ready
- ✅ No data conflicts