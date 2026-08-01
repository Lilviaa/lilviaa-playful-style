-- Migration 014_drop_product_category_text.sql
-- The 'category' TEXT column in the products table is entirely redundant and dead data.
-- The true source of truth is 'category_id' (UUID) which references the categories table.
-- The PostgREST API inherently masks the 'category' TEXT column by aliasing the categories join to 'category'.

ALTER TABLE public.products
DROP COLUMN IF EXISTS category;
