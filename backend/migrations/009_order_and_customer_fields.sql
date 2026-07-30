-- ============================================
-- 009: Add tracking, call_confirmed to orders
--      and tags to user_profiles
-- ============================================

-- Orders: tracking number for shipments
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Orders: COD call confirmation flag
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS call_confirmed BOOLEAN NOT NULL DEFAULT false;

-- User Profiles: customer tags (vip, repeat, high_value, etc.)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Update the status CHECK to include 'confirmed' and 'packed' stages
-- that the admin order flow expects
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'));
