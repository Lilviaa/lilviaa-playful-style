-- 008_razorpay_stock_release.sql
-- Function to release reserved stock for expired pending orders (older than 15 mins)

CREATE OR REPLACE FUNCTION release_expired_stock_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_order RECORD;
BEGIN
    -- Loop through all orders that are pending and older than 15 minutes
    FOR expired_order IN 
        SELECT id 
        FROM public.orders 
        WHERE status = 'pending' 
          AND created_at < now() - interval '15 minutes'
    LOOP
        -- 1. Decrement reserved stock for all items in this order
        UPDATE public.product_variants pv
        SET reserved_stock = GREATEST(0, pv.reserved_stock - oi.quantity)
        FROM public.order_items oi
        WHERE oi.product_variant_id = pv.id
          AND oi.order_id = expired_order.id;

        -- 2. Update order status to cancelled
        UPDATE public.orders
        SET status = 'cancelled'
        WHERE id = expired_order.id;

        -- 3. Update payment_transactions to failed
        UPDATE public.payment_transactions
        SET status = 'failed',
            error_details = '{"reason": "payment_timeout", "message": "15-minute hold expired"}'::jsonb
        WHERE order_id = expired_order.id
          AND status = 'pending';
    END LOOP;
END;
$$;

-- Note: In Supabase, pg_cron can be enabled and scheduled via the pg_cron extension.
-- If the pg_cron extension is available, we schedule it:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('release_expired_stock', '* * * * *', 'SELECT release_expired_stock_reservations();');
