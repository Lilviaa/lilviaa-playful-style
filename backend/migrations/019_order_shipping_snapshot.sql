-- Migration 019: Add shipping address snapshot to orders

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Backfill shipping_address snapshot for existing orders that have a valid shipping_address_id
UPDATE public.orders o
SET shipping_address = jsonb_build_object(
    'full_name', a.full_name,
    'phone', a.phone,
    'address', a.address,
    'city', a.city,
    'state', a.state,
    'zip', a.zip
)
FROM public.addresses a
WHERE o.shipping_address_id = a.id
  AND o.shipping_address IS NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
