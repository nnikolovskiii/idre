-- Migration script to add username column to users table
-- Run this script against your PostgreSQL database

-- Add username column to users table
ALTER TABLE users ADD COLUMN username VARCHAR(50);

-- Create unique index on username
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Update existing users with temporary usernames (you may want to customize this)
-- This sets username to 'user_' + user_id for existing users
UPDATE users SET username = 'user_' || REPLACE(user_id::text, '-', '') WHERE username IS NULL;

-- Make username column NOT NULL after setting values
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'username';
