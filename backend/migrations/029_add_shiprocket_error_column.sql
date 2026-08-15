-- 029: Add missing shiprocket_error column to orders table
-- 
-- This column was referenced in admin_orders.py and order-detail-drawer.tsx
-- but was never created in migration 026. Writes to it were silently ignored.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shiprocket_error TEXT;
