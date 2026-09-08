-- 030_sequential_order_ids.sql
-- Change order IDs from UUID hashes to sequential ORD-LV-XXXX format

-- 1. Add order_number column
ALTER TABLE public.orders ADD COLUMN order_number INTEGER;

-- 2. Create sequence for order_number
CREATE SEQUENCE public.orders_order_number_seq;

-- 3. Backfill order_number for existing rows chronologically
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) as rn
  FROM public.orders
)
UPDATE public.orders 
SET order_number = ordered.rn 
FROM ordered 
WHERE public.orders.id = ordered.id;

-- 4. Set the sequence current value to the max order_number
SELECT setval('public.orders_order_number_seq', COALESCE((SELECT max(order_number) FROM public.orders), 1));

-- 5. Set default and NOT NULL constraints on order_number
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;

-- 6. Add the generated display_id column
-- Left pads the order_number with 0s to a minimum of 4 digits
ALTER TABLE public.orders ADD COLUMN display_id TEXT GENERATED ALWAYS AS ('ORD-LV-' || lpad(order_number::text, 4, '0')) STORED;
