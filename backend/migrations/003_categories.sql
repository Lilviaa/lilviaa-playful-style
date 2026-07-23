-- ============================================
-- MILESTONE 3: Categories Schema
-- ============================================

-- 1. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for sorting/slug
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- Public read access for categories
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

-- 2. Modify Products table to link to Categories
-- Since this is an MVP without live data, we can drop the old text column and add the foreign key.
ALTER TABLE public.products DROP COLUMN IF EXISTS category;
ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
