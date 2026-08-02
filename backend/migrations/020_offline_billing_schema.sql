-- ============================================
-- 020: Offline Billing Schema & RPC
-- ============================================

-- 1. Update Payment Method constraint to allow 'cash' for POS
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
    CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'cash'));

-- 2. Create offline_customers table
CREATE TABLE IF NOT EXISTS public.offline_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    gst TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for offline_customers (No user policies needed as we use service_role)
ALTER TABLE public.offline_customers ENABLE ROW LEVEL SECURITY;

-- 3. Custom type for order items to pass array to RPC
DO $$ BEGIN
    CREATE TYPE public.offline_order_item AS (
        product_variant_id UUID,
        quantity INTEGER,
        unit_price NUMERIC(10, 2),
        total_price NUMERIC(10, 2)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create RPC for atomic offline order creation
CREATE OR REPLACE FUNCTION public.create_offline_order(
    p_offline_customer_name TEXT,
    p_offline_customer_phone TEXT,
    p_total_amount NUMERIC(10, 2),
    p_payment_method TEXT,
    p_cashier_id TEXT,
    p_items public.offline_order_item[]
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item public.offline_order_item;
    v_current_stock INTEGER;
BEGIN
    -- 1. Loop through items to verify and deduct stock
    -- We lock the rows with FOR UPDATE to prevent race conditions (overselling)
    FOREACH v_item IN ARRAY p_items
    LOOP
        SELECT stock INTO v_current_stock
        FROM public.product_variants
        WHERE id = v_item.product_variant_id
        FOR UPDATE;
        
        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product variant % not found', v_item.product_variant_id;
        END IF;

        IF v_current_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product variant % (Requested: %, Available: %)', 
                v_item.product_variant_id, v_item.quantity, v_current_stock;
        END IF;

        -- Deduct stock
        UPDATE public.product_variants
        SET stock = stock - v_item.quantity,
            updated_at = now()
        WHERE id = v_item.product_variant_id;
    END LOOP;

    -- 2. Create the order
    INSERT INTO public.orders (
        status,
        total_amount,
        shipping_amount,
        payment_method,
        order_source,
        cashier_id,
        offline_customer_name,
        offline_customer_phone
    ) VALUES (
        'confirmed', -- Or 'delivered' if offline billing is instantaneous
        p_total_amount,
        0, -- Offline orders have no shipping fee
        p_payment_method,
        'offline',
        p_cashier_id,
        p_offline_customer_name,
        p_offline_customer_phone
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert order items
    FOREACH v_item IN ARRAY p_items
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_variant_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_order_id,
            v_item.product_variant_id,
            v_item.quantity,
            v_item.unit_price,
            v_item.total_price
        );
    END LOOP;

    -- Return the newly created order ID
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
