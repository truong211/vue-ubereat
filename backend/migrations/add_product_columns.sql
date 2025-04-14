-- Add missing columns to products table
ALTER TABLE products
ADD COLUMN preparationTime INT,
ADD COLUMN nutritionInfo JSON,
MODIFY COLUMN ingredients JSON,
MODIFY COLUMN allergens JSON,
ADD COLUMN isSpicy BOOLEAN DEFAULT FALSE,
ADD COLUMN isVegetarian BOOLEAN DEFAULT FALSE,
ADD COLUMN isVegan BOOLEAN DEFAULT FALSE,
ADD COLUMN isGlutenFree BOOLEAN DEFAULT FALSE;