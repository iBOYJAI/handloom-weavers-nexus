-- Add address column to users for delivery address (saved for checkout reuse)
-- Run once. If column already exists, skip or run: ALTER TABLE users DROP COLUMN address; then run this again.
ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone;
