-- 031_order_format_ord_lil.sql
-- Update display_id column on public.orders to use ORD-LIL-XXXX format

-- 1. Drop existing generated column
ALTER TABLE public.orders DROP COLUMN IF EXISTS display_id;

-- 2. Add updated generated display_id column with ORD-LIL- prefix (zero-padded to at least 4 digits)
ALTER TABLE public.orders ADD COLUMN display_id TEXT GENERATED ALWAYS AS ('ORD-LIL-' || lpad(order_number::text, 4, '0')) STORED;

-- 3. Ensure index exists on display_id for fast lookup and search
CREATE INDEX IF NOT EXISTS idx_orders_display_id ON public.orders(display_id);
