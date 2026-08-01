-- Migration 018: Add reviews table

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    text TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

-- Authenticated users can insert their own reviews
CREATE POLICY "Authenticated users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger to protect moderation fields from user tampering
CREATE OR REPLACE FUNCTION public.protect_review_moderation()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an end-user making the request, ignore attempts to change moderation fields
    IF auth.role() IN ('authenticated', 'anon') THEN
        NEW.status = OLD.status;
        NEW.is_featured = OLD.is_featured;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_review_moderation
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_review_moderation();

-- Authenticated users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Admin permissions are handled via the service role key which bypasses RLS
