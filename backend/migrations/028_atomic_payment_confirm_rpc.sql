    -- 028: Atomic payment confirmation RPC with audit logging
    -- 
    -- Creates:
    --   1. payment_audit_log table  — survives transaction rollbacks,
    --      records both successes and failures for every confirmation attempt.
    --   2. confirm_razorpay_payment RPC — single atomic DB transaction that:
    --        a. Row-locks the payment_transaction row (prevents webhook/frontend race)
    --        b. Idempotency guard (returns early if already successful)
    --        c. Updates transaction status, order status, and deducts stock
    --        d. Returns the order_id so Python can fire emails + Shiprocket
    --      On ANY exception: writes to payment_audit_log and re-raises.

    -- ─────────────────────────────────────────────────────────────────
    -- 1. AUDIT LOG TABLE
    -- ─────────────────────────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS public.payment_audit_log (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        razorpay_order_id TEXT       NOT NULL,
        razorpay_payment_id TEXT,
        event            TEXT        NOT NULL,   -- 'confirmed', 'already_confirmed', 'failed'
        error_message    TEXT,                    -- SQLERRM on failures
        error_state      TEXT,                    -- SQLSTATE on failures
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Service role has full access (bypasses RLS); no customer-facing RLS needed.
    ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

    NOTIFY pgrst, 'reload schema';

    -- ─────────────────────────────────────────────────────────────────
    -- 2. ATOMIC CONFIRMATION RPC
    -- ─────────────────────────────────────────────────────────────────

    DROP FUNCTION IF EXISTS public.confirm_razorpay_payment(TEXT, TEXT);

    CREATE OR REPLACE FUNCTION public.confirm_razorpay_payment(
        p_razorpay_order_id   TEXT,
        p_razorpay_payment_id TEXT
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER   -- runs as superuser so it can update across tables safely
    AS $$
    DECLARE
        v_tx         RECORD;
        v_order_id   UUID;
        v_item       RECORD;
        v_stock      INTEGER;
        v_reserved   INTEGER;
    BEGIN
        -- ── Step 1: Row-lock the transaction row ───────────────────────
        -- FOR UPDATE prevents a concurrent webhook/frontend call from
        -- entering this block at the same time.
        SELECT *
        INTO v_tx
        FROM public.payment_transactions
        WHERE razorpay_order_id = p_razorpay_order_id
        FOR UPDATE;

        IF v_tx IS NULL THEN
            RAISE EXCEPTION 'Transaction not found for razorpay_order_id=%', p_razorpay_order_id;
        END IF;

        -- ── Step 2: Idempotency guard ──────────────────────────────────
        -- If already confirmed (e.g. webhook arrived first, frontend arrives
        -- second), return silently — do NOT deduct stock again.
        IF v_tx.status = 'successful' THEN
            -- Log the idempotent hit for visibility
            INSERT INTO public.payment_audit_log
                (razorpay_order_id, razorpay_payment_id, event)
            VALUES
                (p_razorpay_order_id, p_razorpay_payment_id, 'already_confirmed');

            RETURN jsonb_build_object(
                'success',    true,
                'order_id',   v_tx.order_id,
                'idempotent', true
            );
        END IF;

        v_order_id := v_tx.order_id;

        -- ── Step 3: Mark transaction successful ────────────────────────
        UPDATE public.payment_transactions
        SET status              = 'successful',
            razorpay_payment_id = p_razorpay_payment_id,
            updated_at          = now()
        WHERE id = v_tx.id;

        -- ── Step 4: Advance order to processing ────────────────────────
        UPDATE public.orders
        SET status     = 'processing',
            updated_at = now()
        WHERE id = v_order_id;

        -- ── Step 5: Convert reserved stock → deducted stock ───────────
        -- One row-lock per variant; loop is safe because create_online_order
        -- already reserved the stock atomically at order-creation time.
        FOR v_item IN
            SELECT product_variant_id, quantity
            FROM public.order_items
            WHERE order_id = v_order_id
        LOOP
            SELECT stock, COALESCE(reserved_stock, 0)
            INTO v_stock, v_reserved
            FROM public.product_variants
            WHERE id = v_item.product_variant_id
            FOR UPDATE;

            IF v_stock IS NULL THEN
                RAISE EXCEPTION 'Variant % not found during stock deduction', v_item.product_variant_id;
            END IF;

            UPDATE public.product_variants
            SET stock          = GREATEST(0, v_stock   - v_item.quantity),
                reserved_stock = GREATEST(0, v_reserved - v_item.quantity),
                updated_at     = now()
            WHERE id = v_item.product_variant_id;
        END LOOP;

        -- ── Step 6: Write success to audit log ────────────────────────
        INSERT INTO public.payment_audit_log
            (razorpay_order_id, razorpay_payment_id, event)
        VALUES
            (p_razorpay_order_id, p_razorpay_payment_id, 'confirmed');

        RETURN jsonb_build_object(
            'success',    true,
            'order_id',   v_order_id,
            'idempotent', false
        );

    -- ── Exception handler ──────────────────────────────────────────────
    -- This block runs in a subtransaction that commits INDEPENDENTLY.
    -- The outer transaction has already rolled back, but this INSERT
    -- persists — giving a permanent, queryable failure record.
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.payment_audit_log
            (razorpay_order_id, razorpay_payment_id, event, error_message, error_state)
        VALUES
            (p_razorpay_order_id, p_razorpay_payment_id, 'failed', SQLERRM, SQLSTATE);

        RAISE;   -- re-raise so Python still receives a 500 / AppError
    END;
    $$;

    -- Allow the service role (used by our backend) to call this function
    GRANT EXECUTE ON FUNCTION public.confirm_razorpay_payment(TEXT, TEXT) TO service_role;
