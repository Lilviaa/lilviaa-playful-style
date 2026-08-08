-- Migration: Add is_printed column to orders table
-- Description: Tracks whether an order has been printed via the billing software

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE;

-- Optional: Create an index to speed up filtering by printed status
CREATE INDEX IF NOT EXISTS idx_orders_is_printed ON orders(is_printed);
