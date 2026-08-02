-- 021: Online Order RPC with stock race condition fix

-- Drop if exists (just in case)
DROP FUNCTION IF EXISTS public.create_online_order;

CREATE OR REPLACE FUNCTION public.create_online_order(
    p_user_id UUID,
    p_status TEXT,
    p_total_amount NUMERIC(10, 2),
    p_shipping_amount NUMERIC(10, 2),
    p_payment_method TEXT,
    p_shipping_address_id UUID,
    p_shipping_address JSONB,
    p_coupon_id UUID,
    p_discount_amount NUMERIC(10, 2),
    p_is_cod BOOLEAN,
    p_items public.offline_order_item[]
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_item public.offline_order_item;
    v_current_stock INTEGER;
    v_reserved INTEGER;
BEGIN
    -- 1. Loop through items to verify and reserve/deduct stock with FOR UPDATE
    FOREACH v_item IN ARRAY p_items
    LOOP
        SELECT stock, COALESCE(reserved_stock, 0) INTO v_current_stock, v_reserved
        FROM public.product_variants
        WHERE id = v_item.product_variant_id
        FOR UPDATE;
        
        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product variant % not found', v_item.product_variant_id;
        END IF;

        IF p_is_cod THEN
            IF v_current_stock < v_item.quantity THEN
                RAISE EXCEPTION 'Insufficient stock. Only % left.', v_current_stock;
            END IF;
            
            UPDATE public.product_variants
            SET stock = stock - v_item.quantity,
                updated_at = now()
            WHERE id = v_item.product_variant_id;
        ELSE
            IF (v_current_stock - v_reserved) < v_item.quantity THEN
                RAISE EXCEPTION 'Insufficient stock. Only % left.', (v_current_stock - v_reserved);
            END IF;

            UPDATE public.product_variants
            SET reserved_stock = v_reserved + v_item.quantity,
                reserved_until = now() + interval '15 minutes',
                updated_at = now()
            WHERE id = v_item.product_variant_id;
        END IF;
    END LOOP;

    -- 2. Create the order
    INSERT INTO public.orders (
        user_id,
        status,
        total_amount,
        shipping_amount,
        payment_method,
        shipping_address_id,
        shipping_address,
        order_source,
        coupon_id,
        discount_amount
    ) VALUES (
        p_user_id,
        p_status,
        p_total_amount,
        p_shipping_amount,
        p_payment_method,
        p_shipping_address_id,
        p_shipping_address,
        'online',
        p_coupon_id,
        p_discount_amount
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

    -- 4. Apply coupon usage if present
    IF p_coupon_id IS NOT NULL THEN
        INSERT INTO public.coupon_usages (
            coupon_id,
            user_id,
            order_id,
            discount_applied
        ) VALUES (
            p_coupon_id,
            p_user_id,
            v_order_id,
            p_discount_amount
        );
    END IF;

    -- 5. Return order ID
    RETURN json_build_object('id', v_order_id);
END;
$$ LANGUAGE plpgsql;
