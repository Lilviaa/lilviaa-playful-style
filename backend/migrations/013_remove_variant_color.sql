-- Remove color and color_hex from product_variants
ALTER TABLE public.product_variants 
DROP COLUMN IF EXISTS color,
DROP COLUMN IF EXISTS color_hex;
