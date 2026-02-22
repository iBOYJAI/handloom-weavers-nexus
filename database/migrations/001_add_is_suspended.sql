-- Add is_suspended column to users table for admin suspend/reactivate feature
-- Run: mysql -u root -p handloom_nexus < database/migrations/001_add_is_suspended.sql
-- Note: Run once. If column exists, ignore the error.

ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE AFTER is_approved;
