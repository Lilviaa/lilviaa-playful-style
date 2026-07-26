-- 007_category_genders.sql
-- Add applicable_genders to categories table

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS applicable_genders TEXT[] DEFAULT '{boys, girls, unisex}';

-- Update existing defaults
UPDATE public.categories SET applicable_genders = '{girls, unisex}' WHERE slug IN ('dresses', 'skirts');
UPDATE public.categories SET applicable_genders = '{boys, girls, unisex}' WHERE slug NOT IN ('dresses', 'skirts');
