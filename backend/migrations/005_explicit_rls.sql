-- ============================================
-- MILESTONE 3: EXPLICIT ROLE-BASED RLS
-- ============================================

-- Categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Products
-- Keep the existing public read policy for published only
-- DROP POLICY IF EXISTS "Public can view published products" ON public.products;
-- CREATE POLICY "Public can view published products" ON public.products FOR SELECT USING (status = 'published');

-- Add Admin policies for full CRUD (Admins can view ALL products including drafts)
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Product Variants
-- Keep existing public read policy
-- DROP POLICY IF EXISTS "Public can view published variants" ON public.product_variants;
-- CREATE POLICY "Public can view published variants" ON public.product_variants FOR SELECT USING ( ... );

CREATE POLICY "Admins can view all variants" ON public.product_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can insert variants" ON public.product_variants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can update variants" ON public.product_variants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can delete variants" ON public.product_variants FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Product Images
-- Keep existing public read policy
-- DROP POLICY IF EXISTS "Public can view published images" ON public.product_images;
-- CREATE POLICY "Public can view published images" ON public.product_images FOR SELECT USING ( ... );

CREATE POLICY "Admins can view all images" ON public.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can insert images" ON public.product_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can update images" ON public.product_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can delete images" ON public.product_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
