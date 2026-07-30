-- Migration 012_admin_analytics_rpcs.sql
-- These functions aggregate sensitive order data across the entire platform.
-- We do NOT use SECURITY DEFINER because the backend calls these using the service_role key, 
-- which already bypasses RLS. Keeping them as SECURITY INVOKER (the default) adds defense-in-depth:
-- if an attacker somehow calls these from the frontend, RLS will block them from seeing other users' orders.
-- However, we still explicitly revoke EXECUTE from public/authenticated to completely hide the function signatures.

-- 1. get_dashboard_revenue
CREATE OR REPLACE FUNCTION public.get_dashboard_revenue(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS NUMERIC
LANGUAGE sql
SET search_path = public
AS $$
    SELECT COALESCE(SUM(total_amount), 0)
    FROM orders
    WHERE created_at >= start_date 
      AND created_at < end_date
      AND status NOT IN ('cancelled', 'returned');
$$;

-- Restrict access
REVOKE EXECUTE ON FUNCTION public.get_dashboard_revenue(TIMESTAMPTZ, TIMESTAMPTZ) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_revenue(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;


-- 2. get_dashboard_daily_revenue (For the 30-day chart)
CREATE OR REPLACE FUNCTION public.get_dashboard_daily_revenue(start_date TIMESTAMPTZ)
RETURNS TABLE (date_group DATE, revenue NUMERIC)
LANGUAGE sql
SET search_path = public
AS $$
    SELECT 
        DATE(created_at AT TIME ZONE 'UTC') as date_group,
        SUM(total_amount) as revenue
    FROM orders
    WHERE created_at >= start_date
      AND status NOT IN ('cancelled', 'returned')
    GROUP BY DATE(created_at AT TIME ZONE 'UTC')
    ORDER BY date_group ASC;
$$;

-- Restrict access
REVOKE EXECUTE ON FUNCTION public.get_dashboard_daily_revenue(TIMESTAMPTZ) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_daily_revenue(TIMESTAMPTZ) TO service_role;


-- 3. get_top_products
CREATE OR REPLACE FUNCTION public.get_top_products(limit_count INT DEFAULT 5)
RETURNS TABLE (
    product_id UUID,
    total_units BIGINT,
    total_revenue NUMERIC
)
LANGUAGE sql
SET search_path = public
AS $$
    SELECT 
        v.product_id,
        SUM(i.quantity) as total_units,
        SUM(i.total_price) as total_revenue
    FROM order_items i
    JOIN orders o ON i.order_id = o.id
    JOIN product_variants v ON i.product_variant_id = v.id
    WHERE o.status NOT IN ('cancelled', 'returned')
    GROUP BY v.product_id
    ORDER BY total_units DESC
    LIMIT limit_count;
$$;

-- Restrict access
REVOKE EXECUTE ON FUNCTION public.get_top_products(INT) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_top_products(INT) TO service_role;
