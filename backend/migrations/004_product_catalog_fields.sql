-- ============================================
-- MILESTONE 3: STRICT MODE CATALOG FIELDS
-- ============================================

-- Add frontend-required fields to products
ALTER TABLE public.products ADD COLUMN gender TEXT CHECK (gender IN ('boys', 'girls', 'unisex'));
ALTER TABLE public.products ADD COLUMN age_range TEXT;
ALTER TABLE public.products ADD COLUMN tag TEXT CHECK (tag IN ('new', 'bestseller', 'sale') OR tag IS NULL);

-- Add frontend-required hex code to product_variants
ALTER TABLE public.product_variants ADD COLUMN color_hex TEXT;
