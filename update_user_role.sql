-- Update User 4 role from 'restaurant' to 'admin'
UPDATE users 
SET role = 'admin' 
WHERE id = 4;

-- Verify the update
SELECT id, username, email, role 
FROM users 
WHERE id = 4; 