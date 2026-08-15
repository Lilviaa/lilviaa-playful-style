-- ==============================================================================
-- DATABASE WIPE SCRIPT
-- ==============================================================================
-- WARNING: This will delete all products, categories, orders, carts, coupons, 
-- and all non-admin users from the database.
-- 
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

BEGIN;

-- 1. Truncate all transactional and catalog tables (CASCADE handles foreign keys)
TRUNCATE TABLE 
    public.orders,
    public.order_items,
    public.payment_transactions,
    public.payment_audit_log,
    public.cart_items,
    public.reviews,
    public.product_variants,
    public.product_images,
    public.products,
    public.banners,
    public.coupons,
    public.coupon_usages,
    public.offline_customers,
    public.audit_logs,
    public.addresses
CASCADE;

-- 2. Delete all NON-admin users. 
-- Due to ON DELETE CASCADE, this will also wipe their user_profiles.
-- Admin user_profiles will be retained safely.
DELETE FROM public.users WHERE role != 'admin';

-- NOTE: CMS data (hero_slides, category_tiles, featured_products, etc.) 
-- are NOT truncated by default so you don't have to redesign your homepage layout.
-- If you want to wipe the CMS design data too, uncomment the block below:

/*
TRUNCATE TABLE 
    public.hero_slides,
    public.category_tiles,
    public.featured_products,
    public.cms_sections,
    public.philosophy_cards
CASCADE;
*/

COMMIT;
