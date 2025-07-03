-- 001_user_phone_unique_avatar.sql
-- Ensure `phone` field is unique & add `avatarUrl` column if it does not yet exist

-- Add avatarUrl column (ignore error if already exists)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS avatarUrl VARCHAR(255) NULL AFTER profileImage;

-- Add unique index to phone (ignore if already exists)
ALTER TABLE users 
  ADD UNIQUE INDEX idx_users_phone_unique (phone);